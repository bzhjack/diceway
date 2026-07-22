import {ChangeDetectionStrategy, Component, computed, input, output, signal} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {BolHerosArmeModel} from '../../../models/bol-arme.model';
import {AttackChoice, combatActionsFor, CombatActionOption, dualWieldDegats, NORMALE_ACTION} from '../../combat-action.util';

/**
 * Bouton épée d'un jeton de combat : ouvre un menu compact (choix d'arme + action du tour) avant
 * de laisser le parent entrer en mode ciblage. Auto-contenu comme `bol-add-menu` (bouton + mat-menu
 * dans le même composant), pour rester réutilisable sur chaque jeton sans état partagé.
 */
@Component({
  selector: 'bol-attack-menu',
  imports: [MatIconModule, MatMenuModule],
  templateUrl: './attack-menu.html',
  styleUrl: './attack-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttackMenuComponent {
  readonly attackerName = input.required<string>();
  /** Armes du héros — tableau vide pour masquer la section arme (pnj/créature/démon, ou chargement en cours). */
  readonly armes = input<readonly BolHerosArmeModel[]>([]);

  /** Émis à l'ouverture du menu, pour laisser le parent charger les armes du héros à la demande. */
  readonly opened = output<void>();
  readonly confirmed = output<AttackChoice>();

  protected readonly actions = computed(() => combatActionsFor(this.armes()));

  private readonly selectedArmeId = signal<number | null>(null);
  protected readonly selectedAction = signal<CombatActionOption>(NORMALE_ACTION);

  protected readonly effectiveArme = computed(() => {
    const list = this.armes();
    if (list.length === 0) {
      return null;
    }
    const id = this.selectedArmeId();
    return list.find((a) => a.id === id) ?? list[0];
  });

  protected reset(): void {
    this.selectedArmeId.set(null);
    this.selectedAction.set(NORMALE_ACTION);
    this.opened.emit();
  }

  protected selectArme(id: number | undefined): void {
    this.selectedArmeId.set(id ?? null);
  }

  protected confirm(): void {
    const action = this.selectedAction();
    const armes = this.armes();
    const degats =
      action.id === 'deux-armes' && armes.length >= 2 ? dualWieldDegats(armes) : (this.effectiveArme()?.arme?.degats ?? null);

    this.confirmed.emit({action, degats});
  }
}
