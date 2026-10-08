import {ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked, ViewEncapsulation, viewChild, WritableSignal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {forkJoin, take} from 'rxjs';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {InitiativeResultat} from '../../../models/bol-fight-session.model';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {DiceBoxHostComponent} from '../../../../shared/dice-3d/dice-box-host';
import {applyHeroismeDelta} from '../../heroisme-spend.util';
import {diceFromTotal} from '../../action-roll.util';
import {AddCombatantDialogComponent} from '../add-combatant-dialog/add-combatant-dialog';
import {AmbushState} from '../../../models/combat-selection.model';
import {INITIATIVE_RESULT_OPTIONS} from '../../initiative.util';
import {StartCombatDialogData} from '../../models/start-combat-dialog.model';

interface AdversaryRow {
  readonly pivotId: number;
  readonly kind: 'pnj' | 'creature' | 'demon';
  readonly nom: string;
  /** Rang BoL fixe : les PNJ, créatures et démons n'ont pas de jet de réaction, ce rang les place dans l'ordre. */
  readonly rang: 'rival' | 'coriace' | 'pietaille';
  /** Initiative : celle d'un PNJ ; les créatures et démons n'en ont pas (0). */
  readonly initiative: number;
  /** Un allié des héros ne leur oppose pas son initiative. */
  readonly ally: boolean;
}

/** Un bloc de l'aperçu de la frise : ses combattants, et s'il est bloqué au round 1. */
/** Une ligne de l'aperçu : un combattant, que l'on peut retirer de la table. */
export interface PreviewLine {
  readonly label: string;
  /** Exclu de ce combat : il reste sur la table, mais ne joue pas. */
  readonly excluded: boolean;
  readonly kind: 'hero' | 'pnj' | 'creature' | 'demon';
  readonly pivotId: number;
}

export interface PreviewGroup {
  readonly id: string;
  readonly title: string;
  readonly lines: readonly PreviewLine[];
  readonly blocked: boolean;
}

const HERO_RANK_SYMBOL: Partial<Record<InitiativeResultat, string>> = {legendaire: '①', heroique: '②', reussite: '③', echec: '⑥', echec_critique: '⑧'};

interface HeroRow {
  readonly pivotId: number;
  readonly herosId: string;
  readonly nom: string;
  readonly resultat: InitiativeResultat | null;
  readonly esprit: number;
  readonly initiative: number;
}

/** Seuil de réussite du jet de réaction BoL (02-actions-combat.md) — fixe, jamais modifié par les règles. */
const THRESHOLD = 9;

const RESULT_LABELS: Record<InitiativeResultat, string> = Object.fromEntries(
  INITIATIVE_RESULT_OPTIONS.map((opt) => [opt.value, opt.label]),
) as Record<InitiativeResultat, string>;

/**
 * Ajoute les adversaires (dialog existant, réutilisé) puis fait rouler l'initiative de chaque héros
 * avant de démarrer le combat. Le jet d'initiative se joue directement dans la liste (un seul
 * plateau de dés partagé, activé ligne par ligne) plutôt que dans un dialog séparé par héros —
 * chaque ligne garde aussi un champ de saisie manuelle du total des dés (2d6 physiques). Les
 * modificateurs d'embuscade et d'initiative adverse (02-actions-combat.md) sont communs à toute la
 * rencontre, réglés une fois au-dessus de la liste plutôt que par héros.
 */
@Component({
  selector: 'bol-start-combat-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, MatTooltipModule, DiceBoxHostComponent],
  templateUrl: './start-combat-dialog.html',
  styleUrl: './start-combat-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class StartCombatDialogComponent {
  protected readonly ref = inject(MatDialogRef<StartCombatDialogComponent, boolean>);
  protected readonly data = inject<StartCombatDialogData>(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly herosService = inject(BolHerosService);
  private readonly snackBar = inject(MatSnackBar);

  private readonly diceBox = viewChild(DiceBoxHostComponent);

  protected readonly loading = signal(true);
  protected readonly starting = signal(false);
  protected readonly adversaries = signal<readonly AdversaryRow[]>([]);
  protected readonly heroes = signal<readonly HeroRow[]>([]);
  protected readonly existingHeroIds = signal<ReadonlySet<string>>(new Set());

  /** Héroïsme courant par héros (clé pivotId) — signal dédié car `applyHeroismeDelta` le mute en place. */
  private readonly heroismeByPivot = new Map<number, WritableSignal<number>>();
  /** Dernier total de dés saisi/lancé par héros (clé pivotId) — purement d'affichage, non persisté
   * (le back ne stocke que le résultat/palier, pas le total brut). Vide au réouverture du dialog. */
  private readonly diceTotalByPivot = signal<ReadonlyMap<number, number>>(new Map());

  /** Héros actuellement "sous les projecteurs" du plateau de dés partagé — null tant qu'aucune ligne n'a été activée. */
  protected readonly activePivotId = signal<number | null>(null);
  protected readonly rolling = signal(false);
  protected readonly dice = signal<readonly [number, number] | null>(null);
  protected readonly critiqueChosen = signal(false);
  protected readonly legendaryChosen = signal(false);

  protected readonly activeHero = computed(() => this.heroes().find((h) => h.pivotId === this.activePivotId()) ?? null);

  /** Embuscade (02-actions-combat.md, "Modificateurs au jet de réaction") : tendre une embuscade ou
   * surprendre l'ennemi donne +2 (Très facile), être surpris ou pris en embuscade donne −1 (Ardue).
   * Fait commun à toute la rencontre, pas par héros. */
  protected readonly ambushState = signal<AmbushState>(null);
  /** Idem : « si un coriace ou un rival possède une valeur d'initiative, prenez la plus haute valeur d'initiative
   * parmi les adversaires des héros, et appliquez-la en malus au jet de réaction des héros ». Calculée d'après les
   * PNJ présents (seuls ils ont une initiative) ; le MJ peut la corriger à la main. */
  protected readonly hasInitiativeAdversary = computed(() =>
    this.activeAdversaries().some((a) => !a.ally && (a.rang === 'rival' || a.rang === 'coriace')),
  );
  protected readonly detectedInitiative = computed(() =>
    Math.max(0, ...this.activeAdversaries().filter((a) => !a.ally && (a.rang === 'rival' || a.rang === 'coriace')).map((a) => a.initiative)),
  );
  private readonly initiativeOverride = signal<number | null>(null);
  protected readonly adversaryInitiativeMalus = computed(() =>
    this.hasInitiativeAdversary() ? (this.initiativeOverride() ?? this.detectedInitiative()) : 0,
  );

  protected readonly modifierTotal = computed(() => {
    const ambush = this.ambushState() === 'heroes_ambush' ? 2 : this.ambushState() === 'heroes_ambushed' ? -1 : 0;
    return ambush - this.adversaryInitiativeMalus();
  });

  protected readonly canStart = computed(
    () => this.activeAdversaries().length > 0 && this.activeHeroes().every((h) => h.resultat !== null),
  );

  protected readonly isNatural2 = computed(() => {
    const d = this.dice();
    return !!d && d[0] === 1 && d[1] === 1;
  });

  protected readonly isNatural12 = computed(() => {
    const d = this.dice();
    return !!d && d[0] === 6 && d[1] === 6;
  });

  protected readonly diceSum = computed(() => {
    const d = this.dice();
    return d ? d[0] + d[1] : null;
  });

  protected readonly activeTotal = computed(() => {
    const sum = this.diceSum();
    const hero = this.activeHero();
    return sum === null || !hero ? null : sum + hero.esprit + hero.initiative + this.modifierTotal();
  });

  /** Résultat suggéré pour le héros actif : 2/12 naturels priment sur le seuil (règles absolues). */
  protected readonly suggestedResult = computed<InitiativeResultat | null>(() => {
    if (!this.dice()) {
      return null;
    }
    if (this.isNatural2()) {
      return this.critiqueChosen() ? 'echec_critique' : 'echec';
    }
    if (this.isNatural12()) {
      return this.legendaryChosen() ? 'legendaire' : 'heroique';
    }
    const total = this.activeTotal();
    return total !== null && total >= THRESHOLD ? 'reussite' : 'echec';
  });

  /** Cartes (`{kind}-{pivotId}`) exclues de ce combat : elles restent sur la table et reviennent à la fin du combat. */
  protected readonly excluded = signal<ReadonlySet<string>>(new Set());

  protected isExcluded(kind: PreviewLine['kind'], pivotId: number): boolean {
    return this.excluded().has(`${kind}-${pivotId}`);
  }

  /** Exclut un héros ou un adversaire de ce combat — ou le réintègre. Rien n'est retiré de la table. */
  protected toggleExcluded(kind: PreviewLine['kind'], pivotId: number): void {
    const key = `${kind}-${pivotId}`;
    this.excluded.update((set) => {
      const next = new Set(set);
      if (!next.delete(key)) {
        next.add(key);
      }
      return next;
    });
  }

  /** Les héros et adversaires qui participent à ce combat. */
  private readonly activeHeroes = computed(() => this.heroes().filter((h) => !this.isExcluded('hero', h.pivotId)));
  private readonly activeAdversaries = computed(() => this.adversaries().filter((a) => !this.isExcluded(a.kind, a.pivotId)));

  /** Un héros a obtenu un succès héroïque ou mieux : au round 1, coriaces et piétaille sont bloqués. */
  protected readonly roundOneLocked = computed(() =>
    this.activeHeroes().some((h) => h.resultat === 'heroique' || h.resultat === 'legendaire'),
  );

  /** Aperçu de la frise : les héros d'après leur jet, les autres d'après leur rang. */
  protected readonly preview = computed<readonly PreviewGroup[]>(() => {
    const heroes = this.heroes();
    const advs = this.adversaries();
    const locked = this.roundOneLocked();
    const heroLines = (results: readonly InitiativeResultat[]): PreviewLine[] =>
      heroes
        .filter((h) => h.resultat && results.includes(h.resultat))
        .map((h) => ({label: `${h.nom} ${HERO_RANK_SYMBOL[h.resultat!]}`, excluded: this.isExcluded('hero', h.pivotId), kind: 'hero', pivotId: h.pivotId}));
    const names = (rang: AdversaryRow['rang']): PreviewLine[] =>
      advs
        .filter((a) => a.rang === rang)
        .map((a) => ({label: a.nom, excluded: this.isExcluded(a.kind, a.pivotId), kind: a.kind, pivotId: a.pivotId}));
    return [
      {id: 'heros', title: 'Héros ①②③', lines: heroLines(['legendaire', 'heroique', 'reussite']), blocked: false},
      {id: 'rival', title: 'Rivaux ④', lines: names('rival'), blocked: false},
      {id: 'coriace', title: 'Coriaces ⑤', lines: names('coriace'), blocked: locked},
      {id: 'echec', title: 'Héros en échec ⑥', lines: heroLines(['echec']), blocked: false},
      {id: 'pietaille', title: 'Piétaille ⑦', lines: names('pietaille'), blocked: locked},
      {id: 'echec_critique', title: 'Échec critique ⑧', lines: heroLines(['echec_critique']), blocked: false},
    ];
  });

  /** Ce que la table doit savoir avant de commencer : jets manquants, égalités entre héros, succès légendaire. */
  protected readonly previewNote = computed(() => {
    const heroes = this.activeHeroes();
    if (this.activeAdversaries().length === 0) {
      return 'Aucun adversaire : ajoutes-en pour pouvoir démarrer.';
    }
    if (heroes.some((h) => h.resultat === null)) {
      return 'Chaque héros doit avoir un résultat.';
    }
    const results = heroes.map((h) => h.resultat);
    if (results.some((r, i) => results.indexOf(r) !== i)) {
      return "Égalité entre deux héros : ils décident entre eux, sinon l'agilité la plus haute agit d'abord.";
    }
    return results.includes('legendaire') ? "Succès légendaire : +1 à tous les jets d'attaque pendant la rencontre." : '';
  });

  /** Vrai tant que la liste n'a pas été chargée une première fois : les jets des combats précédents sont alors effacés. */
  private freshOpen = true;

  constructor() {
    this.reload();

    // Un modificateur de la table (embuscade, initiative ennemie) change : les jets déjà faits sont recalculés avec leurs dés.
    effect(() => {
      const modifier = this.modifierTotal();
      untracked(() => this.rescoreRolledHeroes(modifier));
    });
  }

  /** Recalcule le résultat des héros qui ont déjà lancé. Un 2 ou un 12 naturel prime sur les modificateurs : leur résultat ne bouge pas. */
  private rescoreRolledHeroes(modifier: number): void {
    for (const hero of this.heroes()) {
      const dice = this.diceTotalFor(hero.pivotId);
      if (dice === null || dice === 2 || dice === 12 || hero.resultat === null) {
        continue;
      }
      const resultat: InitiativeResultat = dice + hero.esprit + hero.initiative + modifier >= THRESHOLD ? 'reussite' : 'echec';
      if (resultat === hero.resultat) {
        continue;
      }
      this.fightSessionService.updateHeroInitiative(this.data.sessionId, hero.pivotId, resultat).subscribe({
        next: () => this.heroes.update((list) => list.map((h) => (h.pivotId === hero.pivotId ? {...h, resultat} : h))),
        error: (error: unknown) =>
          this.snackBar.open(extractApiErrorMessage(error, 'Impossible de mettre à jour un jet de réaction.'), 'Fermer', {duration: 5000}),
      });
    }
  }

  private reload(): void {
    this.loading.set(true);
    this.fightSessionService
      .fightSession(this.data.sessionId)
      .pipe(take(1))
      .subscribe({
        next: (session) => {
          this.adversaries.set([
            ...(session.pnjs ?? []).map((p) => ({pivotId: p.id, kind: 'pnj' as const, nom: p.surnom ?? p.nom, rang: p.rang, initiative: p.initiative ?? 0, ally: p.camp === 'heros'})),
            ...(session.creatures ?? []).map((c) => ({pivotId: c.id, kind: 'creature' as const, nom: c.surnom ?? c.nom, rang: c.rang, initiative: 0, ally: c.camp === 'heros'})),
            ...(session.demons ?? []).map((d) => ({pivotId: d.id, kind: 'demon' as const, nom: d.surnom ?? d.nom, rang: d.rang, initiative: 0, ally: d.camp === 'heros'})),
          ]);
          this.existingHeroIds.set(new Set((session.heros ?? []).map((h) => String(h.heros_id))));

          const heroEntries = session.heros ?? [];
          if (heroEntries.length === 0) {
            this.freshOpen = false;
            this.heroes.set([]);
            this.loading.set(false);
            return;
          }

          forkJoin(heroEntries.map((h) => this.herosService.heros(h.heros_id).pipe(take(1)))).subscribe({
            next: (fullHeroes) => {
              this.heroes.set(
                heroEntries.map((h, i) => {
                  const hero = fullHeroes[i];
                  this.heroismeSignal(h.id).set(hero.ressources.heroisme);
                  return {
                    pivotId: h.id,
                    herosId: h.heros_id,
                    nom: hero.origines.nom ?? 'Héros',
                    // Un nouveau combat réclame un nouveau jet de réaction (02-actions-combat.md) : à l'ouverture,
                    // les résultats d'un jet précédent (dialogue annulé, combat interrompu) ne sont pas repris.
                    resultat: this.freshOpen ? null : h.initiative_resultat,
                    esprit: hero.attributs.esprit,
                    initiative: hero.combat.initiative_effective,
                  };
                }),
              );
              if (this.freshOpen) {
                this.clearStoredResults(heroEntries.filter((h) => h.initiative_resultat !== null).map((h) => h.id));
                this.freshOpen = false;
              }
              this.loading.set(false);
            },
            error: (error: unknown) => {
              this.loading.set(false);
              this.snackBar.open(extractApiErrorMessage(error, 'Impossible de charger les héros.'), 'Fermer', {
                duration: 5000,
              });
            },
          });
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.snackBar.open(extractApiErrorMessage(error, 'Impossible de charger la session.'), 'Fermer', {
            duration: 5000,
          });
        },
      });
  }

  /** Héroïsme courant d'un héros — signal dédié (créé à la demande) car `applyHeroismeDelta` le mute en place. */
  protected heroismeSignal(pivotId: number): WritableSignal<number> {
    let sig = this.heroismeByPivot.get(pivotId);
    if (!sig) {
      sig = signal(0);
      this.heroismeByPivot.set(pivotId, sig);
    }
    return sig;
  }

  protected diceTotalFor(pivotId: number): number | null {
    return this.diceTotalByPivot().get(pivotId) ?? null;
  }

  protected resultLabel(result: InitiativeResultat | null): string {
    return result ? RESULT_LABELS[result] : '';
  }

  protected signed(value: number): string {
    return value >= 0 ? `+${value}` : `− ${Math.abs(value)}`;
  }

  protected setAmbush(state: AmbushState): void {
    this.ambushState.set(state);
  }

  protected setAdversaryMalus(rawValue: string): void {
    const value = Math.trunc(Number(rawValue));
    this.initiativeOverride.set(Number.isFinite(value) && value >= 0 && value !== this.detectedInitiative() ? value : null);
  }

  protected openAddAdversary(): void {
    this.dialog
      .open(AddCombatantDialogComponent, {
        width: 'min(760px, 94vw)',
        maxWidth: '94vw',
        maxHeight: '85vh',
        data: {
          sessionId: this.data.sessionId,
          existingHeroIds: this.existingHeroIds(),
        },
      })
      .afterClosed()
      .subscribe(() => this.reload());
  }

  /** Active une ligne sur le plateau de dés partagé — remet à zéro l'état de jet en cours. */
  private activate(hero: HeroRow): void {
    this.activePivotId.set(hero.pivotId);
    this.dice.set(null);
    this.critiqueChosen.set(false);
    this.legendaryChosen.set(false);
  }

  protected async rollFor(hero: HeroRow): Promise<void> {
    const box = this.diceBox();
    if (!box || this.rolling()) {
      return;
    }

    this.activate(hero);
    this.rolling.set(true);
    try {
      await box.clear();
      const results = await box.rollNotation('2d6');
      const [a, b] = results.map((r) => r.value);
      this.dice.set([a, b]);
      this.diceTotalByPivot.update((map) => new Map(map).set(hero.pivotId, a + b));
      this.persistSuggested(hero);
    } finally {
      this.rolling.set(false);
    }
  }

  /** Saisie manuelle du total des 2d6 physiques (pas le résultat final avec bonus) — mêmes règles
   * absolues 2/12 qu'un lancer virtuel, via la reconstruction de paire `diceFromTotal`. */
  protected onManualTotal(hero: HeroRow, rawValue: string): void {
    if (this.rolling()) {
      return;
    }

    const total = Number(rawValue);
    if (!Number.isInteger(total) || total < 2 || total > 12) {
      return;
    }

    this.activate(hero);
    this.dice.set(diceFromTotal(total));
    this.diceTotalByPivot.update((map) => new Map(map).set(hero.pivotId, total));
    this.persistSuggested(hero);
  }

  /** Efface côté serveur les résultats d'un jet précédent, pour que la table n'en garde aucun. */
  private clearStoredResults(pivotIds: readonly number[]): void {
    for (const pivotId of pivotIds) {
      this.fightSessionService.updateHeroInitiative(this.data.sessionId, pivotId, null).subscribe({
        error: (error: unknown) =>
          this.snackBar.open(extractApiErrorMessage(error, "Impossible d'effacer un jet d'initiative précédent."), 'Fermer', {duration: 5000}),
      });
    }
  }

  /** Lance le jet de chaque héros qui n'en a pas encore, l'un après l'autre (un seul plateau de dés). */
  protected async rollAll(): Promise<void> {
    for (const hero of this.activeHeroes().filter((h) => h.resultat === null)) {
      await this.rollFor(hero);
    }
  }

  /** Formule d'un jet de réaction, chaque terme nommé : « 2d6 (9) + 2 (initiative) − 1 (embuscade) ≥ 9 ». Les termes nuls
   * sont omis ; le total des dés n'apparaît qu'une fois le jet fait. */
  protected formulaFor(hero: HeroRow): string {
    const total = this.diceTotalFor(hero.pivotId);
    const ambush = this.ambushState() === 'heroes_ambush' ? 2 : this.ambushState() === 'heroes_ambushed' ? -1 : 0;
    const terms: [number, string][] = [
      [hero.esprit, 'esprit'],
      [hero.initiative, 'initiative'],
      [ambush, 'embuscade'],
      [-this.adversaryInitiativeMalus(), 'initiative ennemie'],
    ];
    const tail = terms
      .filter(([value]) => value !== 0)
      .map(([value, label]) => ` ${value > 0 ? '+' : '−'} ${Math.abs(value)} (${label})`)
      .join('');
    return `2d6${total === null ? '' : ` (${total})`}${tail} ≥ ${THRESHOLD}`;
  }

  protected initial(nom: string): string {
    return nom.trim().charAt(0).toUpperCase();
  }

  /** Échec critique (2 naturel) : choisir OCTROIE 1 PH ; revenir sur "Échec" le reprend. */
  protected chooseCritique(chosen: boolean): void {
    const hero = this.activeHero();
    if (!hero || chosen === this.critiqueChosen()) {
      return;
    }
    this.critiqueChosen.set(chosen);
    applyHeroismeDelta(this.herosService, this.snackBar, hero.herosId, this.heroismeSignal(hero.pivotId), chosen ? 1 : -1, () =>
      this.critiqueChosen.set(!chosen),
    );
    this.persistSuggested(hero);
  }

  /** Succès légendaire (12 naturel) : choisir DÉPENSE 1 PH ; revenir sur "Héroïque" la rembourse. */
  protected chooseLegendaire(chosen: boolean): void {
    const hero = this.activeHero();
    if (!hero || chosen === this.legendaryChosen() || (chosen && this.heroismeSignal(hero.pivotId)() <= 0)) {
      return;
    }
    this.legendaryChosen.set(chosen);
    applyHeroismeDelta(this.herosService, this.snackBar, hero.herosId, this.heroismeSignal(hero.pivotId), chosen ? -1 : 1, () =>
      this.legendaryChosen.set(!chosen),
    );
    this.persistSuggested(hero);
  }

  private persistSuggested(hero: HeroRow): void {
    const resultat = this.suggestedResult();
    if (!resultat) {
      return;
    }

    this.fightSessionService.updateHeroInitiative(this.data.sessionId, hero.pivotId, resultat).subscribe({
      next: () => {
        this.heroes.update((list) => list.map((h) => (h.pivotId === hero.pivotId ? {...h, resultat} : h)));
      },
      error: (error: unknown) => {
        this.snackBar.open(extractApiErrorMessage(error, "Impossible d'enregistrer ce jet d'initiative."), 'Fermer', {
          duration: 5000,
        });
      },
    });
  }

  protected start(): void {
    this.starting.set(true);
    this.fightSessionService.startCombat(this.data.sessionId, [...this.excluded()]).subscribe({
      next: () => {
        this.starting.set(false);
        this.ref.close(true);
      },
      error: (error: unknown) => {
        this.starting.set(false);
        this.snackBar.open(extractApiErrorMessage(error, 'Impossible de démarrer le combat.'), 'Fermer', {
          duration: 5000,
        });
      },
    });
  }

  protected close(): void {
    this.ref.close(undefined);
  }
}
