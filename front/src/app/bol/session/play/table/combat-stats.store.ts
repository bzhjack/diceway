import {computed, effect, inject, Injectable, signal, untracked} from '@angular/core';
import {catchError, forkJoin, of, take} from 'rxjs';
import {BolHerosModel} from '../../../models/bol-heros.model';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolCombatReferenceService} from '../../../services/bol-combat-reference.service';
import {BolCombatOptionModel} from '../../../models/bol-combat-reference.model';
import {BolHerosService} from '../../../services/bol-heros.service';
import {resolveAttackStats} from '../../combat-attack.util';
import {ActionRollCarriere} from '../../models/action-roll.model';
import {BolHerosArmeModel} from '../../../models/bol-arme.model';
import {equippedArmes} from '../../../shared/arme/arme-equipee';
import {tokenForCard} from '../tapis/combat-turn.util';
import {appliquerEvenement, idAleatoire} from '../tapis/combat-effects.util';
import {HeroismeChange, ResolvedCombatStats} from '../../models/combat-attack.model';
import {heroDetails} from '../tapis/tapis.util';
import {TapisCard} from '../../models/tapis.model';
import {TableStore} from './table.store';
import {CombatTurnStore} from './combat-turn.store';

/** Les armes d'un héros dont le catalogue est chargé — vide si elles ne le sont pas (de simples ids). */
function loadedArmes(hero: BolHerosModel): BolHerosArmeModel[] {
  return Array.isArray(hero.armes) && hero.armes.length > 0 && typeof hero.armes[0] !== 'number'
    ? (hero.armes as BolHerosArmeModel[])
    : [];
}

/** Ce qu'il faut savoir sur l'attaquant et ses cibles pour jouer : leurs statistiques résolues, relues quand la table change, les armes et carrières du héros actif, et ses points dépensés. */
@Injectable()
export class CombatStatsStore {
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly herosService = inject(BolHerosService);
  private readonly combatReference = inject(BolCombatReferenceService);
  private readonly table = inject(TableStore);
  private readonly combat = inject(CombatTurnStore);

  /** Options de combat (postures) — référence statique, chargée une fois. */
  readonly combatOptions = signal<readonly BolCombatOptionModel[]>([]);

  /** Id du héros actif — les armes ne sont rechargées que lorsqu'il change, pas à chaque
   * rechargement de la session. */
  readonly activeHeroId = computed(() => {
    const active = this.combat.activeCard();
    return active?.kind === 'hero' ? active.sourceId : null;
  });

  readonly activeArmes = signal<readonly BolHerosArmeModel[]>([]);

  /** Toutes les armes du héros actif, équipées ou non — pour l'arme secondaire du combat à deux armes. */
  readonly activeOwnedArmes = signal<readonly BolHerosArmeModel[]>([]);

  /** Carrières du héros dont c'est le tour : le MJ peut en laisser une aider une manœuvre ou une feinte. */
  readonly activeCarrieres = signal<readonly ActionRollCarriere[]>([]);

  /** Armes proposées à l'assistant : celles du héros actif ; pour un PNJ, toutes ses armes — il les a toutes en main. */
  readonly assistantArmes = computed<readonly BolHerosArmeModel[]>(() => {
    const active = this.combat.activeCard();
    if (active?.kind !== 'pnj') {
      return this.activeArmes();
    }
    const armes = this.table.session()?.pnjs?.find((p) => p.id === active.pivotId)?.armes ?? [];
    return armes
      .filter((a) => a.nom)
      .map((a, index) => ({
        id: 1000 + index,
        arme_id: 1000 + index,
        equipee: true,
        arme: {id: null, arme: a.nom ?? '', type: a.type ?? 'M', degats: a.degats, portee: a.portee ?? null, notes: null},
      }));
  });

  /** Statistiques résolues de l'attaquant et de la cible — la défense totale de la cible (+2) est déjà ajoutée. */
  readonly attackerStats = signal<ResolvedCombatStats | null>(null);

  readonly targetStats = signal<ResolvedCombatStats | null>(null);

  private statsRun = 0;

  /** Statistiques de chaque carte que la carte active peut viser (clé de carte → statistiques) : son jeton, dans l'assistant, annonce
   * ce qu'il faut pour la toucher. */
  readonly targetsStats = signal<ReadonlyMap<string, ResolvedCombatStats>>(new Map());

  private targetsStatsRun = 0;

  constructor() {
    this.combatReference
      .getCombatOptions()
      .pipe(take(1))
      .subscribe((options) => this.combatOptions.set(options));

    // Statistiques de l'attaquant et de la cible, relues à chaque changement de carte active, de cible ou de table.
    effect(() => {
      const attacker = this.combat.activeCard();
      const target = this.combat.selectedTarget();
      const tokens = this.table.board()?.tokens ?? [];
      const run = ++this.statsRun;
      const attackerToken = attacker ? tokenForCard(tokens, attacker) : null;
      const targetToken = target ? tokenForCard(tokens, target) : null;
      if (!attackerToken) {
        this.attackerStats.set(null);
        this.targetStats.set(null);
        return;
      }
      forkJoin({
        attacker: resolveAttackStats(attackerToken, this.herosService),
        target: targetToken && target ? resolveAttackStats(targetToken, this.herosService) : of(null),
      })
        .pipe(take(1))
        .subscribe(({attacker: attackerStats, target: targetStats}) => {
          if (run !== this.statsRun) {
            return;
          }
          this.attackerStats.set(attackerStats);
          this.targetStats.set(targetStats);
        });
    });

    // Statistiques de toutes les cartes à portée, pour leurs jetons dans l'assistant : relues quand la carte active ou la liste des
    // cibles change. La cible choisie, elle, est relue à chaque changement de la table (ci-dessus) : son jet reste exact.
    effect(() => {
      const activeKey = this.combat.activeKey();
      this.combat.targetKeys();
      untracked(() => {
        const run = ++this.targetsStatsRun;
        const tokens = this.table.board()?.tokens ?? [];
        const cards = activeKey ? this.combat.targets() : [];
        if (cards.length === 0) {
          this.targetsStats.set(new Map());
          return;
        }
        forkJoin(
          cards.map((card) => {
            const token = tokenForCard(tokens, card);
            return token ? resolveAttackStats(token, this.herosService).pipe(catchError(() => of(null))) : of(null);
          }),
        )
          .pipe(take(1))
          .subscribe((stats) => {
            if (run !== this.targetsStatsRun) {
              return;
            }
            const byKey = new Map<string, ResolvedCombatStats>();
            cards.forEach((card, index) => {
              const resolved = stats[index];
              if (resolved) {
                byKey.set(card.key, resolved);
              }
            });
            this.targetsStats.set(byKey);
          });
      });
    });

    // Armes du héros dont c'est le tour, pour l'assistant de tour.
    effect(() => {
      const herosId = this.activeHeroId();
      this.activeArmes.set([]);
      this.activeOwnedArmes.set([]);
      this.activeCarrieres.set([]);
      if (!herosId) {
        return;
      }
      this.herosService
        .heros(herosId)
        .pipe(take(1))
        .subscribe((hero) => this.showIfActive(herosId, hero));
    });
  }

  /** Un héros vient d'être relu : s'il est celui dont c'est le tour, ses armes et ses carrières suivent. */
  showIfActive(herosId: string, hero: BolHerosModel): void {
    if (this.activeHeroId() === herosId) {
      this.activeArmes.set(equippedArmes(loadedArmes(hero)));
      this.activeOwnedArmes.set(loadedArmes(hero));
      this.activeCarrieres.set(heroDetails(hero).carrieres);
    }
  }

  /** Un jet d'attaque vient d'être fait contre cette cible : le registre le sait (le petit bouclier est dépensé pour ce round). */
  onAttackRolled(target: TapisCard): void {
    const attaquant = this.combat.activeCard()?.key;
    if (!attaquant) {
      return;
    }
    // Le petit bouclier de la cible, s'il en porte un, est dépensé pour ce round.
    const stats = this.combat.selectedTarget()?.key === target.key ? this.targetStats() : (this.targetsStats().get(target.key) ?? null);
    const petitBouclier = (stats?.bouclierMalusUneAttaque ?? 0) > 0;
    this.combat.saveEtat((etat) => ({...etat, effets: [...appliquerEvenement(etat.effets, {type: 'jet-attaque', attaquant, cible: target.key, petitBouclier}, idAleatoire)]}));
  }

  /** Le héros actif dépense ou gagne des points d'héroïsme sur son jet d'attaque (faveur divine, échec critique, succès héroïque ou
   * légendaire) : affiché tout de suite, enregistré, et repris si l'enregistrement échoue. */
  onHeroismeAdjusted(delta: number): void {
    const active = this.combat.activeCard();
    if (active?.kind === 'pnj') {
      this.adjustVilenie(active, delta, (by) => this.attackerStats.update((stats) => (stats ? {...stats, heroisme: Math.max(0, (stats.heroisme ?? 0) + by)} : stats)));
      return;
    }
    const herosId = this.attackerStats()?.herosId;
    if (!herosId) {
      return;
    }
    const shift = (by: number): void =>
      this.attackerStats.update((stats) => (stats?.herosId === herosId ? {...stats, heroisme: Math.max(0, (stats.heroisme ?? 0) + by)} : stats));
    shift(delta);
    this.herosService.adjustHeroisme(herosId, delta).subscribe({
      error: (error: unknown) => {
        shift(-delta);
        this.table.notifyError(error, "Impossible de mettre à jour l'héroïsme.");
      },
    });
  }

  /** La cible, un héros, dépense de l'héroïsme pour se défendre (parade in extremis, « Juste une égratignure ») : affiché tout de suite
   * sur sa carte, enregistré, et repris si l'enregistrement échoue. */
  onTargetHeroismeAdjusted(change: HeroismeChange): void {
    if (change.card.kind === 'pnj') {
      this.adjustVilenie(change.card, change.delta, (by) => this.targetStats.update((stats) => (stats ? {...stats, heroisme: Math.max(0, (stats.heroisme ?? 0) + by)} : stats)));
      return;
    }
    const herosId = change.card.kind === 'hero' ? change.card.sourceId : null;
    if (!herosId) {
      return;
    }
    const shift = (by: number): void =>
      this.targetStats.update((stats) => (stats?.herosId === herosId ? {...stats, heroisme: Math.max(0, (stats.heroisme ?? 0) + by)} : stats));
    shift(change.delta);
    this.herosService.adjustHeroisme(herosId, change.delta).subscribe({
      error: (error: unknown) => {
        shift(-change.delta);
        this.table.notifyError(error, "Impossible de mettre à jour l'héroïsme.");
      },
    });
  }

  /** Vilénie d'un rival dépensée ou rendue pendant un jet : affichée tout de suite (`shift`), enregistrée sur sa ligne de session, puis
   * la session à jour est posée ; en cas d'erreur, l'affichage revient en arrière. */
  private adjustVilenie(card: TapisCard, delta: number, shift: (by: number) => void): void {
    const sessionId = this.table.sessionId();
    if (!sessionId) {
      return;
    }
    shift(delta);
    this.fightSessionService.adjustVilenie(sessionId, card.pivotId, delta).subscribe({
      next: (session) => this.table.session.set(session),
      error: (error: unknown) => {
        shift(-delta);
        this.table.notifyError(error, 'Impossible de mettre à jour la vilénie.');
      },
    });
  }
}
