import {computed, effect, inject, Injectable, untracked} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {catchError, EMPTY, finalize, forkJoin, map, Observable, of, Subscription, switchMap, take, tap} from 'rxjs';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {BolHerosModel} from '../../../models/bol-heros.model';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {traitsDeRecuperation} from '../../combat-play.util';
import {combatOutcome, horsCombat, tientDebout} from '../tapis/combat-turn.util';
import {degatsMainsNues} from '../tapis/combat-effects.util';
import {CombatOutcome} from '../../models/combat-turn.model';
import {CombatEffect} from '../../models/combat-effect.model';
import {AfterCombatDialogComponent} from '../after-combat-dialog/after-combat-dialog';
import {AfterCombatDialogData, AfterCombatGain, AfterCombatHealer} from '../../models/after-combat-dialog.model';
import {bestHealingCareer, peutSecourir} from '../../rescue.util';
import {browserStorage} from '../table-state.util';
import {heroDetails} from '../tapis/tapis.util';
import {TableStore} from './table.store';
import {CombatTurnStore} from './combat-turn.store';

/** Où se retient l'issue déjà annoncée pour une table : la page se recrée à chaque arrivée, et « Continuer » doit tenir au retour. */
const ISSUE_ANNONCEE = 'dw-issue-annoncee:';

/** La fin d'un combat : « Après combat », ouvert par le MJ ou de lui-même quand un camp tombe, qui enregistre la récupération des blessés et rend la table au mode libre. */
@Injectable()
export class CombatEndService {
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly herosService = inject(BolHerosService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly table = inject(TableStore);
  private readonly combat = inject(CombatTurnStore);

  /** Un camp n'a plus personne debout (hors de combat, paralysé ou retiré du combat) : le combat est gagné ou perdu, une boîte l'annonce. */
  private readonly combatOutcome = computed(() => (this.table.mode() === 'combat' ? combatOutcome(this.table.cards(), this.combat.etat().exclus, this.combat.etat().effets) : null));

  /** L'issue déjà annoncée : lue une fois du stockage, puis tenue ici (sans stockage disponible, elle ne doit pas s'annoncer sans fin). */
  private issue: {readonly sessionId: string; readonly outcome: CombatOutcome | null} | null = null;
  /** « Après combat » se prépare ou est ouvert : un second n'a pas lieu d'être. */
  private enCours = false;
  /** L'annonce qui attend qu'une autre boîte (« Défier la mort »…) se ferme ; une seule à la fois. */
  private attente: Subscription | null = null;

  constructor() {
    // Un camp vient de tomber : « Après combat » s'ouvre, une fois par issue, même si on revient sur la table entre-temps.
    effect(() => {
      const sessionId = this.table.session()?.id;
      const outcome = this.combatOutcome();
      untracked(() => {
        // La table n'est pas encore lue : on n'en sait rien, et surtout pas que l'issue a été démentie.
        if (!sessionId || outcome === this.issueAnnoncee(sessionId)) {
          return;
        }
        this.retenirIssue(sessionId, outcome);
        if (outcome) {
          this.announceOutcome(outcome);
        }
      });
    });
  }

  /** « Terminer le combat » : la boîte « Après combat » montre ce que chaque blessé récupère (repos, dégâts à mains nues, soins
   * médicaux) ; validée, elle l'enregistre et la table repasse en mode libre. Annulée, le combat continue. `outcome` : un camp vient de
   * tomber, elle le dit. */
  askEndCombat(outcome: CombatOutcome | null = null): void {
    const sessionId = this.table.session()?.id;
    if (!sessionId || this.enCours) {
      return;
    }
    this.enCours = true;
    const effets = this.combat.etat().effets;
    const blesses = this.table.cards().filter(
      (card) => card.camp === 'heros' && card.vitaliteMax !== null && card.vitaliteMax > 0 && card.vitaliteCourante !== null && card.vitaliteCourante < card.vitaliteMax,
    );

    this.fichesDuCampDesHeros()
      .pipe(
        switchMap((fiches) => {
          const wounded = blesses.map((card) => ({
            kind: card.kind,
            pivotId: card.pivotId,
            nom: card.nom,
            vitalite: card.vitaliteCourante!,
            vitaliteMax: card.vitaliteMax!,
            vitaliteDepart: Math.min(card.vitaliteMax!, this.combat.etat().depart[card.key] ?? card.vitaliteMax!),
            mainsNues: degatsMainsNues(effets, card.key),
            etat: horsCombat(card, effets),
            ...traitsDeRecuperation(fiches.get(card.key)?.traits),
          }));
          const healers = this.combatHealers(fiches, effets);
          const mourants = this.table.cards().filter((card) => card.camp === 'heros' && horsCombat(card, effets) === 'mourant').map((card) => card.nom);
          return this.dialog
            .open<AfterCombatDialogComponent, AfterCombatDialogData, readonly AfterCombatGain[]>(AfterCombatDialogComponent, {width: '600px', data: {wounded, healers, outcome, mourants}})
            .afterClosed();
        }),
        switchMap((gains) => {
          if (!gains) {
            return EMPTY;
          }
          const saved: Observable<unknown> = gains.length ? forkJoin(gains.map((gain) => this.fightSessionService.applyDamage(sessionId, gain.kind, gain.pivotId, gain.amount))) : of(null);
          return saved.pipe(
            tap(() => {
              if (gains.length) {
                this.snackBar.open(`Après combat — ${gains.map((gain) => `${gain.nom} +${gain.amount}`).join(', ')}`, undefined, {duration: 4500});
              }
            }),
            switchMap(() => this.fightSessionService.endCombat(sessionId)),
          );
        }),
        finalize(() => (this.enCours = false)),
      )
      .subscribe({
        next: (session) => this.table.session.set(session),
        error: (error: unknown) => {
          this.table.loadSession(sessionId);
          this.snackBar.open(extractApiErrorMessage(error, 'Impossible de terminer le combat.'), 'Fermer', {duration: 5000});
        },
      });
  }

  /** Les fiches du camp des héros — héros et PNJ alliés, qui sont aussi des fiches de héros —, par clé de carte : leurs traits changent
   * la récupération d'après combat, et un héros soigneur y a sa carrière. Elles sont relues ; si elles ne se chargent pas, on fait sans
   * (ni soigneur, ni trait). */
  private fichesDuCampDesHeros(): Observable<ReadonlyMap<string, BolHerosModel>> {
    const cards = this.table.cards().filter((card) => (card.kind === 'hero' || card.kind === 'pnj') && card.camp === 'heros' && card.sourceId !== null);
    if (cards.length === 0) {
      return of(new Map());
    }
    return forkJoin(cards.map((card) => this.herosService.heros(card.sourceId!))).pipe(
      map((fiches) => new Map(cards.map((card, i) => [card.key, fiches[i]]))),
      catchError(() => of(new Map<string, BolHerosModel>())),
    );
  }

  /** Les héros et PNJ alliés de la table qui ont une carrière de soins (médecin, guérisseur, rebouteux), avec la mieux classée. Un
   * soigneur hors de combat (inconscient, mourant, mort) ou paralysé ne soigne personne. */
  private combatHealers(fiches: ReadonlyMap<string, BolHerosModel>, effets: readonly CombatEffect[]): readonly AfterCombatHealer[] {
    return this.table.cards()
      .filter((card) => peutSecourir(card) && tientDebout(card, effets))
      .map((card): AfterCombatHealer | null => {
        const fiche = fiches.get(card.key);
        const carriere = fiche ? bestHealingCareer(heroDetails(fiche).carrieres) : null;
        return carriere ? {nom: card.nom, carriere} : null;
      })
      .filter((healer): healer is AfterCombatHealer => healer !== null);
  }

  /** Un camp vient de tomber : « Après combat » s'ouvre. Si une autre boîte est ouverte (« Défier la mort »…), il attend qu'elle se ferme, et ne
   * s'ouvre que si l'issue tient toujours. S'il est déjà ouvert, il n'y a rien à ajouter. */
  private announceOutcome(outcome: CombatOutcome): void {
    this.attente?.unsubscribe();
    this.attente = null;
    if (this.enCours) {
      return;
    }
    const open = (): void => {
      if (this.combatOutcome() === outcome) {
        this.askEndCombat(outcome);
      }
    };
    if (this.dialog.openDialogs.length > 0) {
      this.attente = this.dialog.afterAllClosed.pipe(take(1)).subscribe(open);
    } else {
      open();
    }
  }

  private issueAnnoncee(sessionId: string): CombatOutcome | null {
    if (this.issue?.sessionId === sessionId) {
      return this.issue.outcome;
    }
    const issue = browserStorage()?.getItem(ISSUE_ANNONCEE + sessionId);
    return issue === 'victoire' || issue === 'defaite' ? issue : null;
  }

  private retenirIssue(sessionId: string, outcome: CombatOutcome | null): void {
    this.issue = {sessionId, outcome};
    if (outcome) {
      browserStorage()?.setItem(ISSUE_ANNONCEE + sessionId, outcome);
    } else {
      browserStorage()?.removeItem(ISSUE_ANNONCEE + sessionId);
    }
  }
}
