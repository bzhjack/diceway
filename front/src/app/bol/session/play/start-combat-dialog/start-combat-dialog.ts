import {ChangeDetectionStrategy, Component, computed, inject, signal, ViewEncapsulation, viewChild, WritableSignal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {forkJoin, take} from 'rxjs';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {InitiativeResultat} from '../../../models/bol-fight-session.model';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {DiceBoxHostComponent} from '../../../../shared/dice-3d/dice-box-host';
import {applyHeroismeDelta} from '../../heroisme-spend.util';
import {diceFromTotal} from '../action-roll-dialog/action-roll-dialog';
import {AddCombatantDialogComponent} from '../add-combatant-dialog/add-combatant-dialog';
import {AmbushState} from '../../../services/combat-selection.service';
import {INITIATIVE_RESULT_OPTIONS} from '../../initiative.util';

export interface StartCombatDialogData {
  readonly sessionId: string;
}

interface AdversaryRow {
  readonly pivotId: number;
  readonly nom: string;
}

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
  imports: [MatButtonModule, MatDialogModule, MatIconModule, DiceBoxHostComponent],
  templateUrl: './start-combat-dialog.html',
  styleUrl: './start-combat-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class StartCombatDialogComponent {
  protected readonly ref = inject(MatDialogRef<StartCombatDialogComponent, boolean>);
  private readonly data = inject<StartCombatDialogData>(MAT_DIALOG_DATA);
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
  protected readonly existingPnjIds = signal<ReadonlySet<string>>(new Set());

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
  /** Idem : "si un coriace ou un rival ennemi possède de l'initiative, appliquer la plus haute valeur
   * d'initiative adverse en malus au jet de réaction des héros" — saisie manuelle par le MJ (rare,
   * propre à certaines créatures du bestiaire ; aucune fiche pnj/créature/démon de l'app n'a
   * aujourd'hui d'attribut "initiative" à proprement parler). */
  protected readonly adversaryInitiativeMalus = signal(0);

  protected readonly modifierTotal = computed(() => {
    const ambush = this.ambushState() === 'heroes_ambush' ? 2 : this.ambushState() === 'heroes_ambushed' ? -1 : 0;
    return ambush - this.adversaryInitiativeMalus();
  });

  protected readonly canStart = computed(
    () => this.adversaries().length > 0 && this.heroes().every((h) => h.resultat !== null),
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

  constructor() {
    this.reload();
  }

  private reload(): void {
    this.loading.set(true);
    this.fightSessionService
      .fightSession(this.data.sessionId)
      .pipe(take(1))
      .subscribe({
        next: (session) => {
          this.adversaries.set([
            ...(session.pnjs ?? []).map((p) => ({pivotId: p.id, nom: p.surnom ?? p.nom})),
            ...(session.creatures ?? []).map((c) => ({pivotId: c.id, nom: c.surnom ?? c.nom})),
            ...(session.demons ?? []).map((d) => ({pivotId: d.id, nom: d.surnom ?? d.nom})),
          ]);
          this.existingHeroIds.set(new Set((session.heros ?? []).map((h) => String(h.heros_id))));
          this.existingPnjIds.set(
            new Set((session.pnjs ?? []).map((p) => p.pnj_id).filter((id): id is string => !!id).map(String)),
          );

          const heroEntries = session.heros ?? [];
          if (heroEntries.length === 0) {
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
                    resultat: h.initiative_resultat,
                    esprit: hero.attributs.esprit,
                    initiative: hero.combat.initiative_effective,
                  };
                }),
              );
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
    this.adversaryInitiativeMalus.set(Number.isFinite(value) && value >= 0 ? value : 0);
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
          existingPnjIds: this.existingPnjIds(),
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
    this.fightSessionService.startCombat(this.data.sessionId).subscribe({
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
