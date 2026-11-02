import {effect, inject, Injectable, untracked} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {catchError, concatMap, EMPTY, forkJoin, from, last, map, of, switchMap} from 'rxjs';
import {confirmDialog} from '../../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {maybePromptDefierLaMort} from '../defier-la-mort-dialog/defier-la-mort.util';
import {shouldPromptDefierLaMort} from '../../combat-resolution.util';
import {herosMourants, horsCombat} from '../tapis/combat-turn.util';
import {CombatEffect} from '../../models/combat-effect.model';
import {aSombre, appliquerEvenement, effetAssomme, effetDegatsMainsNues, effetInconscient, effetStabilise, idAleatoire} from '../tapis/combat-effects.util';
import {RescueDialogComponent} from '../rescue-dialog/rescue-dialog';
import {RescueDialogData, RescueResult} from '../../models/rescue-dialog.model';
import {MeleePietailleDialogComponent} from '../melee-pietaille-dialog/melee-pietaille-dialog';
import {MeleePietailleDialogData, MeleePietailleResult} from '../../models/melee-pietaille-dialog.model';
import {AppliedHit, ResolvedCombatStats, VitaliteChange} from '../../models/combat-attack.model';
import {heroDetails} from '../tapis/tapis.util';
import {regenerationsDuRound} from '../tapis/pouvoirs-combat.util';
import {TapisCard} from '../../models/tapis.model';
import {TableStore} from './table.store';
import {CombatTurnStore} from './combat-turn.store';
import {CombatStatsStore} from './combat-stats.store';

/** Les coups et leurs suites : les dégâts enregistrés, « Défier la mort », les héros à 0 qui reprennent leurs esprits ou sombrent, les mourants qui perdent de la vitalité à chaque round, les démons qui se régénèrent, le secours, et les pertes de la mêlée de piétaille. */
@Injectable()
export class CombatWoundsService {
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly herosService = inject(BolHerosService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly table = inject(TableStore);
  private readonly combat = inject(CombatTurnStore);
  private readonly stats = inject(CombatStatsStore);

  /** Le dernier round vu : un nouveau round propose aux héros restés à 0 de reprendre leurs esprits. `null` hors combat et au chargement. */
  private lastRound: number | null = null;

  constructor() {
    // Un nouveau round commence : un héros resté à 0 de vitalité sombre dans l'inconscience, ou dépense 1 PH pour reprendre ses esprits ;
    // un héros mourant perd 1 de vitalité ; un démon qui se régénère en reprend 1.
    effect(() => {
      const round = this.table.mode() === 'combat' ? this.combat.etat().round : null;
      untracked(() => {
        const previous = this.lastRound;
        this.lastRound = round;
        if (round !== null && previous !== null && round > previous) {
          this.askUnconsciousHeroes();
          this.regenerateDemons();
        }
      });
    });
  }

  /** Au début d'un round, chaque héros resté à 0 (02-actions-combat.md, « Blessures, inconscience et mort ») choisit, l'un après l'autre :
   * dépenser 1 PH pour reprendre ses esprits — il remonte à la moitié de sa vitalité, arrondie au supérieur, et rejoue — ou sombrer
   * dans l'inconscience jusqu'à la fin du combat (la récupération d'après combat le remonte alors à la même valeur). Sans point
   * d'héroïsme, il sombre. */
  private askUnconsciousHeroes(): void {
    const sessionId = this.table.sessionId();
    const etat = this.combat.etat();
    const heroes = this.table.cards().filter(
      (card) => card.kind === 'hero' && horsCombat(card) === 'inconscient' && card.sourceId !== null && !etat.exclus.includes(card.key) && !aSombre(etat.effets, card.key),
    );
    if (!sessionId || heroes.length === 0) {
      return;
    }
    from(heroes)
      .pipe(
        concatMap((card) =>
          this.herosService.heros(card.sourceId!).pipe(
            switchMap((hero) => {
              const vitalite = Math.ceil(hero.ressources.vitalite / 2);
              if (hero.ressources.heroisme <= 0) {
                this.snackBar.open(`${card.nom} n'a plus de point d'héroïsme : il sombre dans l'inconscience jusqu'à la fin du combat.`, undefined, {duration: 4500});
                return of({card, revive: false, vitalite});
              }
              return confirmDialog(
                this.dialog,
                {
                  title: `${card.nom} est à 0`,
                  message: `${card.nom} s'est effondré. Il sombre dans l'inconscience jusqu'à la fin du combat, ou dépense 1 point d'héroïsme pour reprendre ses esprits : il remonte à ${vitalite} de vitalité et rejoue dès ce round.`,
                  confirmLabel: 'Reprendre ses esprits (−1 PH)',
                  cancelLabel: 'Sombrer',
                },
                {width: '420px'},
              ).pipe(switchMap((revive) => of({card, revive, vitalite})));
            }),
            catchError(() => EMPTY),
          ),
        ),
      )
      .subscribe(({card, revive, vitalite}) => {
        if (!revive) {
          this.combat.saveEtat((current) => ({...current, effets: [...appliquerEvenement(current.effets, {type: 'ajout-manuel', effet: effetInconscient(card.key)}, idAleatoire)]}));
          return;
        }
        forkJoin([this.herosService.adjustHeroisme(card.sourceId!, -1), this.fightSessionService.applyDamage(sessionId, 'hero', card.pivotId, vitalite)]).subscribe({
          next: () => this.table.loadSession(sessionId),
          error: (error: unknown) => this.table.notifyError(error, 'Impossible de relever ce héros.'),
        });
      });
  }

  /** Au début d'un round, chaque héros mourant (−1 à −5, pas stabilisé) perd 1 de vitalité (02-actions-combat.md, « Blessures,
   * inconscience et mort »). Un message l'annonce, avec « Stabilisé » pour le héros secouru à la table : le point revient et la perte
   * s'arrête. Celui qui passe sous −5 se voit proposer « Défier la mort » pour se stabiliser. `then` passe une fois leurs messages
   * refermés (tout de suite s'il n'y a pas de mourant). */
  private bleedDyingHeroes(then: () => void = () => undefined): void {
    const sessionId = this.table.sessionId();
    const heroes = herosMourants(this.table.cards(), this.combat.etat());
    if (!sessionId || heroes.length === 0) {
      then();
      return;
    }
    forkJoin(heroes.map((card) => this.fightSessionService.applyDamage(sessionId, 'hero', card.pivotId, -1).pipe(map(() => card)))).subscribe({
      next: (bled) => {
        this.table.loadSession(sessionId);
        from(bled)
          .pipe(
            concatMap((card) => {
              const after = (card.vitaliteCourante ?? 0) - 1;
              if (after < -5) {
                this.promptDefierLaMort(card, after);
                return EMPTY;
              }
              return this.snackBar
                .open(`${card.nom} est mourant : il perd 1 de vitalité (${after}).`, 'Stabilisé', {duration: 6000})
                .afterDismissed()
                .pipe(map(({dismissedByAction}) => ({card, stabilise: dismissedByAction})));
            }),
          )
          .subscribe({
            next: ({card, stabilise}) => {
              if (stabilise) {
                this.stabilize(card, 1);
              }
            },
            complete: then,
          });
      },
      error: (error: unknown) => {
        this.table.notifyError(error, 'Impossible de retirer la vitalité des héros mourants.');
        then();
      },
    });
  }

  /** Au début d'un round, chaque démon debout qui a « Régénération » reprend 1 de vitalité, sans dépasser son maximum
   * (04-pnj-creatures-demons.md, « Pouvoirs démoniaques ») ; son coup précis, lui, s'en va de lui-même au bout de 2 rounds
   * (`effetCoupPrecis`). Les points sont rendus d'abord, puis les mourants saignent (`bleedDyingHeroes`, qui relit la table) ; le message
   * de la régénération vient après les leurs, pour ne pas chasser leur bouton « Stabilisé ». */
  private regenerateDemons(): void {
    const sessionId = this.table.sessionId();
    const regenerations = regenerationsDuRound(this.table.cards(), this.combat.etat());
    if (!sessionId || regenerations.length === 0) {
      this.bleedDyingHeroes();
      return;
    }
    const announce = (): void => {
      const noms = regenerations.map(({card, vitalite}) => `${card.nom} (${vitalite}/${card.vitaliteMax})`).join(', ');
      this.snackBar.open(`Régénération : ${noms} ${regenerations.length > 1 ? 'reprennent' : 'reprend'} 1 de vitalité.`, undefined, {duration: 6000});
    };
    from(regenerations)
      .pipe(
        concatMap(({card}) => this.fightSessionService.applyDamage(sessionId, card.kind, card.pivotId, 1)),
        last(),
      )
      .subscribe({
        next: (session) => {
          this.table.session.set(session);
          this.bleedDyingHeroes(announce);
        },
        error: (error: unknown) => {
          this.table.loadSession(sessionId);
          this.table.notifyError(error, 'Impossible de régénérer les démons.');
          this.bleedDyingHeroes();
        },
      });
  }

  /** Un héros mourant est stabilisé : il ne perd plus de vitalité pour le reste du combat. `refund` rend les points qu'il vient de
   * perdre. */
  private stabilize(card: TapisCard, refund = 0): void {
    this.combat.saveEtat((current) => ({...current, effets: [...appliquerEvenement(current.effets, {type: 'ajout-manuel', effet: effetStabilise(card.key)}, idAleatoire)]}));
    const sessionId = this.table.sessionId();
    if (sessionId && refund !== 0) {
      this.fightSessionService.applyDamage(sessionId, 'hero', card.pivotId, refund).subscribe({
        next: (session) => this.table.session.set(session),
        error: (error: unknown) => this.table.notifyError(error, 'Impossible de rendre la vitalité perdue.'),
      });
    }
  }

  /** « Défier la mort » pour un héros tombé sous 0 ou sous −5 : ses points d'héroïsme sont relus, puis le dialogue s'ouvre. */
  private promptDefierLaMort(card: TapisCard, vitalite: number): void {
    const sessionId = this.table.sessionId();
    if (!sessionId || card.sourceId === null) {
      return;
    }
    this.herosService.heros(card.sourceId).subscribe((hero) =>
      maybePromptDefierLaMort({
        dialog: this.dialog,
        fightSessionService: this.fightSessionService,
        herosService: this.herosService,
        sessionId,
        herosId: card.sourceId!,
        pivotId: card.pivotId,
        heroNom: card.nom,
        vitaliteCourante: vitalite,
        heroisme: hero.ressources.heroisme,
        onApplied: () => this.table.loadSession(sessionId),
        onStabilized: () => this.stabilize(card),
      }),
    );
  }

  /** « Secourir » : le héros actif tente de stabiliser un allié mourant (02-actions-combat.md, « Secourir un mourant »), à la place de
   * son attaque. Réussi, le mourant ne perd plus de vitalité ; dans tous les cas, le tour se termine. */
  onRescue(): void {
    const rescuer = this.combat.activeCard();
    const patients = this.combat.rescuePatients();
    if (!rescuer?.sourceId || patients.length === 0) {
      return;
    }
    this.herosService
      .heros(rescuer.sourceId)
      .pipe(
        switchMap((hero) =>
          this.dialog
            .open<RescueDialogComponent, RescueDialogData, RescueResult>(RescueDialogComponent, {
              width: '480px',
              data: {
                rescuerNom: rescuer.nom,
                herosId: rescuer.sourceId!,
                esprit: hero.attributs.esprit,
                heroisme: hero.ressources.heroisme,
                carrieres: heroDetails(hero).carrieres,
                patients: patients.map((card) => ({key: card.key, nom: card.nom, vitalite: card.vitaliteCourante ?? 0})),
              },
            })
            .afterClosed(),
        ),
      )
      .subscribe({
        next: (result) => {
          if (!result) {
            return;
          }
          const patient = patients.find((card) => card.key === result.key);
          if (result.success && patient) {
            this.stabilize(patient);
          }
          this.snackBar.open(result.success ? `${patient?.nom} est stabilisé : il ne perd plus de vitalité.` : `Le secours échoue : ${patient?.nom} reste mourant.`, undefined, {duration: 4500});
          this.combat.onEndTurn(true);
        },
        error: (error: unknown) => this.table.notifyError(error, 'Impossible de charger le secouriste.'),
      });
  }

  /** « Mêlée de piétaille » (04-pnj-creatures-demons.md, « Règle de horde ») : une fois par round, quand les deux camps ont de la piétaille
   * debout, le dialogue tire les pertes de chaque camp et le MJ coche qui tombe. « Appliquer » met chacune à 0 de vitalité (hors de combat)
   * et retient que la mêlée de ce round est faite. La piétaille garde ses tours pour attaquer les héros en horde. */
  onPietailleMelee(): void {
    const sessionId = this.table.sessionId();
    if (!sessionId || this.combat.meleeDisponibilite() !== 'disponible') {
      return;
    }
    const camps = this.combat.meleeCamps();
    this.dialog
      .open<MeleePietailleDialogComponent, MeleePietailleDialogData, MeleePietailleResult>(MeleePietailleDialogComponent, {width: 'min(640px, 94vw)', maxWidth: '94vw', data: {camps}})
      .afterClosed()
      .subscribe((result) => {
        if (!result) {
          return;
        }
        const tombes = [...camps.heros, ...camps.adversaires].filter((card) => result.tombes.includes(card.key));
        const recorded = (): void => {
          this.combat.recordMelee();
          const parCamp = (camp: TapisCard['camp']): string => tombes.filter((card) => card.camp === camp).map((card) => card.nom).join(', ') || 'personne';
          this.snackBar.open(`Mêlée de piétaille — tombent chez les héros : ${parCamp('heros')} ; chez les adversaires : ${parCamp('adversaires')}.`, undefined, {duration: 6000});
        };
        if (tombes.length === 0) {
          recorded();
          return;
        }
        from(tombes)
          .pipe(
            concatMap((card) => this.fightSessionService.applyDamage(sessionId, card.kind, card.pivotId, -Math.max(1, card.vitaliteCourante ?? card.vitaliteMax ?? 1))),
            last(),
          )
          .subscribe({
            next: (session) => {
              this.table.session.set(session);
              recorded();
            },
            error: (error: unknown) => {
              this.table.loadSession(sessionId);
              this.table.notifyError(error, "Impossible d'appliquer les pertes de la mêlée.");
            },
          });
      });
  }

  /** La vitalité de la carte active ou de sa cible corrigée à la main sur son cœur : enregistrée comme des dégâts (ou des soins). */
  onVitaliteAdjusted(change: VitaliteChange): void {
    const stats = change.card.key === this.combat.activeCard()?.key ? this.stats.attackerStats() : this.stats.targetStats();
    this.applyDamageTo(change.card, change.delta, stats);
  }

  /** Dégâts calculés par l'assistant : enregistrés sur la cible. */
  onHitApplied(hit: AppliedHit): void {
    // Une bagarre à mains nues ne fait pas passer sous 0 (livre p. 64) : la cible perd seulement connaissance, sans coma ni
    // « Défier la mort ».
    const before = hit.target.vitaliteCourante ?? 0;
    const damage = hit.unarmed ? Math.min(hit.damage, Math.max(0, before)) : hit.damage;
    if (damage !== 0) {
      this.applyDamageTo(hit.target, -damage, this.stats.targetStats());
    }
    // Les dégâts d'une bagarre se récupèrent en totalité après le combat : le registre les retient, et la cible mise à 0 est assommée.
    if (hit.unarmed && damage > 0) {
      const nouveaux = [effetDegatsMainsNues(hit.target.key, damage), ...(before - damage === 0 ? [effetAssomme(hit.target.key)] : [])];
      this.combat.saveEtat((etat) => ({
        ...etat,
        effets: nouveaux.reduce<readonly CombatEffect[]>((effets, effet) => appliquerEvenement(effets, {type: 'ajout-manuel', effet}, idAleatoire), etat.effets),
      }));
    }
  }

  /** Enregistre une variation de vitalité sur une carte (dégâts négatifs) ; un héros qui tombe sous 0 se voit
   * proposer « Défier la mort ». */
  private applyDamageTo(target: TapisCard, delta: number, targetStats: ResolvedCombatStats | null): void {
    const sessionId = this.table.sessionId();
    if (!sessionId) {
      return;
    }

    this.fightSessionService.applyDamage(sessionId, target.kind, target.pivotId, delta).subscribe({
      next: (session) => {
        this.table.session.set(session);

        const before = target.vitaliteCourante ?? 0;
        const newVitalite = before + delta;
        if (targetStats?.herosId && shouldPromptDefierLaMort(before, newVitalite)) {
          maybePromptDefierLaMort({
            dialog: this.dialog,
            fightSessionService: this.fightSessionService,
            herosService: this.herosService,
            sessionId,
            herosId: targetStats.herosId,
            pivotId: target.pivotId,
            heroNom: target.nom,
            vitaliteCourante: newVitalite,
            heroisme: targetStats.heroisme ?? 0,
            onApplied: () => this.table.loadSession(sessionId),
            onStabilized: () => this.stabilize(target),
          });
        }
      },
      error: (error: unknown) => this.table.notifyError(error, "Impossible d'appliquer les dégâts."),
    });
  }
}
