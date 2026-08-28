import {ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {InitiativeResultat} from '../../../models/bol-fight-session.model';
import {BolHerosModel} from '../../../models/bol-heros.model';
import {CombatCatalogEntry, CombatSelectionService, SelectedCombatant} from '../../../services/combat-selection.service';
import {InitiativeHelpDialogComponent} from '../../initiative-help-dialog/initiative-help-dialog';
import {InitiativeRollDialogComponent} from '../../initiative-roll-dialog/initiative-roll-dialog';
import {INITIATIVE_RESULT_OPTIONS} from '../../initiative.util';
import {combatantKindIcon, combatantKindIconIsSvg, combatantRankLabel, openCombatantStatblock} from '../combat-statblock.util';

/** Carte d'un combattant déjà ajouté : cliquer sur l'avatar ouvre son statbloc, quantité (créatures/démons) et retrait restent des actions séparées. */
@Component({
  selector: 'bol-combatant-card',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './combatant-card.html',
  styleUrl: './combatant-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CombatantCardComponent {
  readonly entry = input.required<CombatCatalogEntry>();
  readonly combatant = input.required<SelectedCombatant>();
  /** Résultat du jet de réaction (héros uniquement) — piloté par la page depuis l'ordre d'initiative calculé. */
  readonly resultat = input<InitiativeResultat | null>(null);
  /** true si ce PNJ/créature/démon (coriace/piétaille) ne joue pas au round 1. */
  readonly lockedRound1 = input(false);
  /** Modificateur net (embuscade + initiative adverse) calculé par la page, identique pour tous les héros. */
  readonly modifierTotal = input(0);

  readonly initiativeChange = output<InitiativeResultat | null>();

  protected readonly selection = inject(CombatSelectionService);
  private readonly dialog = inject(MatDialog);
  private readonly host = inject(ElementRef<HTMLElement>);

  protected readonly resultOptions = INITIATIVE_RESULT_OPTIONS;

  protected openStatblock(): void {
    openCombatantStatblock(this.dialog, this.entry());
  }

  protected openInitiativeHelp(): void {
    this.dialog.open(InitiativeHelpDialogComponent, {maxWidth: 'min(28rem, 92vw)'});
  }

  protected openDiceDialog(): void {
    const stats = this.reactionStats();
    if (!stats) {
      return;
    }

    this.dialog
      .open(InitiativeRollDialogComponent, {
        maxWidth: 'min(30rem, 92vw)',
        panelClass: 'ird-panel',
        data: {
          heroNom: this.entry().nom,
          esprit: stats.esprit,
          initiative: stats.initiative,
          modifierTotal: this.modifierTotal(),
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.initiativeChange.emit(result);
          this.keepCardInView();
        }
      });
  }

  /** Reclique sur le résultat déjà retenu = le désélectionner (retour à "aucun résultat"). */
  protected selectResult(value: InitiativeResultat, event: MouseEvent): void {
    const button = event.currentTarget as HTMLButtonElement;
    this.initiativeChange.emit(this.resultat() === value ? null : value);
    this.keepCardInView(button);
  }

  /**
   * Un résultat change le palier => la carte change de position dans le rail trié. Angular déplace
   * la vue existante (même clé de tracking) mais ce déplacement fait parfois perdre le focus
   * clavier (retombe sur <body>) ; on le restaure explicitement plutôt que de compter sur le
   * navigateur, et on garde la carte visible même si elle saute loin dans la liste.
   */
  private keepCardInView(focusTarget?: HTMLElement): void {
    requestAnimationFrame(() => {
      focusTarget?.focus({preventScroll: true});
      this.host.nativeElement.scrollIntoView({behavior: 'smooth', block: 'nearest'});
    });
  }

  protected readonly rankLabel = computed(() => combatantRankLabel(this.entry()));
  protected readonly kindIcon = computed(() => combatantKindIcon(this.entry().kind));
  protected readonly kindIconIsSvg = computed(() => combatantKindIconIsSvg(this.entry().kind));

  /** Esprit + initiative du héros — les deux valeurs du jet de réaction (2d6 + esprit + initiative). */
  protected readonly reactionStats = computed(() => {
    if (this.entry().kind !== 'hero') {
      return null;
    }

    const hero = this.entry().raw as BolHerosModel;
    return {esprit: hero.attributs.esprit, initiative: hero.combat.initiative, heroisme: hero.ressources.heroisme};
  });

  /** Formule prête à annoncer au joueur : "2d6 + X" (ou "− X"), X = esprit + initiative + modificateurs. */
  protected readonly rollFormula = computed(() => {
    const stats = this.reactionStats();
    if (!stats) {
      return null;
    }

    const total = stats.esprit + stats.initiative + this.modifierTotal();
    return total >= 0 ? `2d6 + ${total}` : `2d6 − ${Math.abs(total)}`;
  });
}
