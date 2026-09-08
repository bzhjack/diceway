import {ChangeDetectionStrategy, Component, computed, input, output, signal} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BolHerosArmeModel} from '../../../models/bol-arme.model';
import {BolCombatOptionModel} from '../../../services/bol-combat-reference.service';

/** Postures gérées par ce menu : un simple modificateur au jet d'attaque de l'attaquant
 * (doc/rules/02-actions-combat.md, "Options de combat"). Le combat à deux armes (parade/double
 * frappe) est exclu : il nécessite le choix d'une arme secondaire, pas géré ici. */
const IN_SCOPE_POSTURE_SLUGS: ReadonlySet<string> = new Set(['none', 'offensive', 'intrepid', 'defensive', 'armor-chink']);

/** Options de combat affichées dans ce menu, triées par ordre d'affichage — "Aucune" en premier. */
export function filterAttackMenuCombatOptions(options: readonly BolCombatOptionModel[]): readonly BolCombatOptionModel[] {
  return options.filter((o) => IN_SCOPE_POSTURE_SLUGS.has(o.slug)).sort((a, b) => a.ordre - b.ordre);
}

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

/** Rappel d'un attribut de combat (agilité, vigueur, mêlée/tir, défense…) affiché au-dessus du choix d'arme. */
export interface CombatReminderStat {
  readonly label: string;
  readonly value: number;
}

/** Choix final du menu épée : arme (dégâts) + posture de combat (`null` = "Aucune"). */
export interface AttackMenuConfirmation {
  readonly degats: string | null;
  readonly posture: BolCombatOptionModel | null;
}

/**
 * Bouton épée d'un jeton de combat : ouvre un menu compact (choix d'arme) avant de laisser le
 * parent entrer en mode ciblage. Auto-contenu comme `bol-add-menu` (bouton + mat-menu dans le même
 * composant), pour rester réutilisable sur chaque jeton sans état partagé.
 */
@Component({
  selector: 'bol-attack-menu',
  imports: [MatIconModule, MatMenuModule, MatTooltipModule],
  templateUrl: './attack-menu.html',
  styleUrl: './attack-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttackMenuComponent {
  readonly attackerName = input.required<string>();
  /** Armes équipées du héros — tableau vide pour pnj/créature/démon ou tant que non chargé. */
  readonly armes = input<readonly BolHerosArmeModel[]>([]);
  /** Rappel des attributs de combat de l'attaquant (agilité, vigueur, mêlée/tir, défense…). */
  readonly stats = input<readonly CombatReminderStat[]>([]);
  /** Options de combat disponibles (référence back `bol_combat_option`), filtrées par le parent ou ici. */
  readonly combatOptions = input<readonly BolCombatOptionModel[]>([]);

  /** Émis à l'ouverture du menu, pour laisser le parent charger les armes du héros à la demande. */
  readonly opened = output<void>();
  /** Arme + posture choisies — `degats: null` garde les dégâts déjà résolus par défaut, `posture: null` = "Aucune". */
  readonly confirmed = output<AttackMenuConfirmation>();

  /** Armes équipées + options toujours disponibles (mains nues, arme improvisée). */
  protected readonly displayArmes = computed(() => [...this.armes(), MAINS_NUES, ARME_IMPROVISEE]);
  protected readonly displayOptions = computed(() => filterAttackMenuCombatOptions(this.combatOptions()));

  private readonly selectedArmeId = signal<number | null>(null);
  private readonly selectedOptionSlug = signal<string | null>(null);

  protected readonly effectiveArme = computed(() => {
    const list = this.displayArmes();
    const id = this.selectedArmeId();
    return list.find((a) => a.id === id) ?? list[0];
  });

  protected readonly effectiveOption = computed(() => {
    const list = this.displayOptions();
    const slug = this.selectedOptionSlug();
    return list.find((o) => o.slug === slug) ?? list[0] ?? null;
  });

  protected reset(): void {
    this.selectedArmeId.set(null);
    this.selectedOptionSlug.set(null);
    this.opened.emit();
  }

  protected selectArme(id: number | undefined): void {
    this.selectedArmeId.set(id ?? null);
  }

  protected selectOption(slug: string): void {
    this.selectedOptionSlug.set(slug);
  }

  protected confirm(): void {
    const option = this.effectiveOption();
    this.confirmed.emit({
      degats: this.effectiveArme()?.arme?.degats ?? null,
      posture: option && option.slug !== 'none' ? option : null,
    });
  }
}
