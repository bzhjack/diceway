import {ChangeDetectionStrategy, Component, computed, inject, input, output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {InitiativeResultat} from '../../../models/bol-fight-session.model';
import {CombatCatalogEntry, CombatSelectionService, SelectedCombatant} from '../../../services/combat-selection.service';
import {INITIATIVE_RESULT_OPTIONS} from '../../initiative.util';
import {combatantKindIcon, combatantKindIconIsSvg, combatantRankLabel, openCombatantStatblock} from '../combat-statblock.util';

/** Carte d'un combattant déjà ajouté : cliquer sur l'avatar ouvre son statbloc, quantité (créatures/démons) et retrait restent des actions séparées. */
@Component({
  selector: 'bol-combatant-card',
  imports: [MatButtonModule, MatIconModule],
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

  readonly initiativeChange = output<InitiativeResultat | null>();

  protected readonly selection = inject(CombatSelectionService);
  private readonly dialog = inject(MatDialog);

  protected readonly resultOptions = INITIATIVE_RESULT_OPTIONS;

  protected openStatblock(): void {
    openCombatantStatblock(this.dialog, this.entry());
  }

  protected onInitiativeChange(value: string): void {
    this.initiativeChange.emit((value || null) as InitiativeResultat | null);
  }

  protected readonly rankLabel = computed(() => combatantRankLabel(this.entry()));
  protected readonly kindIcon = computed(() => combatantKindIcon(this.entry().kind));
  protected readonly kindIconIsSvg = computed(() => combatantKindIconIsSvg(this.entry().kind));
}
