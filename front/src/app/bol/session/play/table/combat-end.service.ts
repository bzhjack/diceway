import {computed, effect, inject, Injectable, untracked} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {catchError, EMPTY, forkJoin, map, Observable, of, switchMap, take, tap} from 'rxjs';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {BolHerosModel} from '../../../models/bol-heros.model';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {traitsDeRecuperation} from '../../combat-play.util';
import {combatOutcome, horsCombat} from '../tapis/combat-turn.util';
import {degatsMainsNues} from '../tapis/combat-effects.util';
import {CombatOutcome} from '../../models/combat-turn.model';
import {CombatOutcomeDialogComponent} from '../combat-outcome-dialog/combat-outcome-dialog';
import {CombatOutcomeDialogData} from '../../models/combat-outcome-dialog.model';
import {AfterCombatDialogComponent} from '../after-combat-dialog/after-combat-dialog';
import {AfterCombatDialogData, AfterCombatGain, AfterCombatHealer} from '../../models/after-combat-dialog.model';
import {bestHealingCareer, peutSecourir} from '../../rescue.util';
import {heroDetails} from '../tapis/tapis.util';
import {TableStore} from './table.store';
import {CombatTurnStore} from './combat-turn.store';

/** La fin d'un combat : l'annonce de l'issue quand un camp tombe, puis « Après combat », qui enregistre la récupération des blessés et rend la session au mode libre. */
@Injectable()
export class CombatEndService {
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly herosService = inject(BolHerosService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly table = inject(TableStore);
  private readonly combat = inject(CombatTurnStore);

  /** Un camp n'a plus personne debout (hors de combat ou retiré du combat) : le combat est gagné ou perdu, une boîte l'annonce. */
  private readonly combatOutcome = computed(() => (this.table.mode() === 'combat' ? combatOutcome(this.table.cards(), this.combat.etat().exclus) : null));

  /** La dernière issue annoncée : la boîte ne revient que si l'issue change (un héros relevé, puis retombé…). */
  private lastOutcome: CombatOutcome | null = null;

  constructor() {
    // Un camp vient de tomber : la boîte de fin de combat s'ouvre, une fois par issue.
    effect(() => {
      const outcome = this.combatOutcome();
      untracked(() => {
        const previous = this.lastOutcome;
        this.lastOutcome = outcome;
        if (outcome && outcome !== previous) {
          this.announceOutcome(outcome);
        }
      });
    });
  }

  /** « Terminer le combat » : la boîte « Après combat » montre ce que chaque blessé récupère (repos, dégâts à mains nues, soins
   * médicaux) ; validée, elle l'enregistre et la session repasse en mode libre. Annulée, le combat continue. */
  askEndCombat(): void {
    const sessionId = this.table.session()?.id;
    if (!sessionId) {
      return;
    }
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
          const healers = this.combatHealers(fiches);
          return this.dialog
            .open<AfterCombatDialogComponent, AfterCombatDialogData, readonly AfterCombatGain[]>(AfterCombatDialogComponent, {width: '600px', data: {wounded, healers}})
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

  /** Les héros et PNJ alliés de la table qui ont une carrière de soins (médecin, guérisseur, rebouteux), avec la mieux classée. */
  private combatHealers(fiches: ReadonlyMap<string, BolHerosModel>): readonly AfterCombatHealer[] {
    return this.table.cards()
      .filter((card) => peutSecourir(card))
      .map((card): AfterCombatHealer | null => {
        const fiche = fiches.get(card.key);
        const carriere = fiche ? bestHealingCareer(heroDetails(fiche).carrieres) : null;
        return carriere ? {nom: card.nom, carriere} : null;
      })
      .filter((healer): healer is AfterCombatHealer => healer !== null);
  }

  /** La boîte de fin de combat : « Terminer le combat » ouvre « Après combat », « Continuer » laisse le temps de secourir un mourant. Si
   * une autre boîte est ouverte (« Défier la mort »…), elle attend qu'elle se ferme, et ne s'ouvre que si l'issue tient toujours. */
  private announceOutcome(outcome: CombatOutcome): void {
    const open = (): void => {
      if (this.combatOutcome() !== outcome) {
        return;
      }
      const effets = this.combat.etat().effets;
      const mourants = this.table.cards()
        .filter((card) => card.camp === 'heros' && horsCombat(card, effets) === 'mourant')
        .map((card) => card.nom);
      this.dialog
        .open<CombatOutcomeDialogComponent, CombatOutcomeDialogData, boolean>(CombatOutcomeDialogComponent, {width: '440px', data: {outcome, mourants}})
        .afterClosed()
        .subscribe((end) => {
          if (end) {
            this.askEndCombat();
          }
        });
    };
    if (this.dialog.openDialogs.length > 0) {
      this.dialog.afterAllClosed.pipe(take(1)).subscribe(open);
    } else {
      open();
    }
  }
}
