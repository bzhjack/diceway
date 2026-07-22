import {ChangeDetectionStrategy, Component, computed, input, output, signal} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {BolHerosArmeModel} from '../../../models/bol-arme.model';

/** Options toujours disponibles en plus des armes équipées (doc/rules/02-actions-combat.md, table des dégâts). */
const MAINS_NUES: BolHerosArmeModel = {
  id: -1,
  arme_id: -1,
  arme: {id: null, arme: 'Mains nues', type: 'M', degats: 'd3', portee: null, notes: null},
};
const ARME_IMPROVISEE: BolHerosArmeModel = {
  id: -2,
  arme_id: -2,
  arme: {id: null, arme: 'Arme improvisée', type: 'M', degats: 'd3', portee: null, notes: null},
};

/**
 * Bouton épée d'un jeton de combat : ouvre un menu compact (choix d'arme) avant de laisser le
 * parent entrer en mode ciblage. Auto-contenu comme `bol-add-menu` (bouton + mat-menu dans le même
 * composant), pour rester réutilisable sur chaque jeton sans état partagé.
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
  /** Armes équipées du héros — tableau vide pour pnj/créature/démon ou tant que non chargé. */
  readonly armes = input<readonly BolHerosArmeModel[]>([]);

  /** Émis à l'ouverture du menu, pour laisser le parent charger les armes du héros à la demande. */
  readonly opened = output<void>();
  /** Dégâts de l'arme choisie — `null` si aucune arme n'a été sélectionnée (garde les dégâts déjà résolus par défaut). */
  readonly confirmed = output<string | null>();

  /** Armes équipées + options toujours disponibles (mains nues, arme improvisée). */
  protected readonly displayArmes = computed(() => [...this.armes(), MAINS_NUES, ARME_IMPROVISEE]);

  private readonly selectedArmeId = signal<number | null>(null);

  protected readonly effectiveArme = computed(() => {
    const list = this.displayArmes();
    const id = this.selectedArmeId();
    return list.find((a) => a.id === id) ?? list[0];
  });

  protected reset(): void {
    this.selectedArmeId.set(null);
    this.opened.emit();
  }

  protected selectArme(id: number | undefined): void {
    this.selectedArmeId.set(id ?? null);
  }

  protected confirm(): void {
    this.confirmed.emit(this.effectiveArme()?.arme?.degats ?? null);
  }
}
