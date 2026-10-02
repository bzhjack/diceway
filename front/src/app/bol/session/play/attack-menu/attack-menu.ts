import {ChangeDetectionStrategy, Component, computed, input, output, signal} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BolHerosArmeModel} from '../../../models/bol-arme.model';
import {BolCombatOptionModel} from '../../../services/bol-combat-reference.service';
import {dualStrikeDegats, isDualWieldEligible} from '../../combat-attack.util';

/** Postures gérées par ce menu (doc/rules/02-actions-combat.md, "Options de combat") — "Défense
 * totale" en est exclue : elle empêche d'attaquer, donc n'a pas sa place dans le flow épée→ciblage
 * (voir le bouton dédié sur le jeton, `bol-battlemap`). */
const IN_SCOPE_POSTURE_SLUGS: ReadonlySet<string> = new Set([
  'none',
  'offensive',
  'intrepid',
  'defensive',
  'armor-chink',
  'dual-parry',
  'dual-strike',
]);

const DUAL_WIELD_SLUGS: ReadonlySet<string> = new Set(['dual-parry', 'dual-strike']);

/** Options de combat affichées dans ce menu, triées par ordre d'affichage — "Aucune" en premier. */
export function filterAttackMenuCombatOptions(options: readonly BolCombatOptionModel[]): readonly BolCombatOptionModel[] {
  return options.filter((o) => IN_SCOPE_POSTURE_SLUGS.has(o.slug)).sort((a, b) => a.ordre - b.ordre);
}

/** Masque les postures de combat à deux armes tant qu'elles ne sont pas jouables : l'arme principale
 * ET au moins une autre arme doivent toutes deux être légères ou moyennes (02-actions-combat.md). */
export function filterVisiblePostures(
  options: readonly BolCombatOptionModel[],
  mainDegats: string | null,
  otherArmesDegats: readonly (string | null)[],
): readonly BolCombatOptionModel[] {
  const dualWieldPlayable = isDualWieldEligible(mainDegats) && otherArmesDegats.some((d) => isDualWieldEligible(d));
  return dualWieldPlayable ? options : options.filter((o) => !DUAL_WIELD_SLUGS.has(o.slug));
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

  private readonly selectedArmeId = signal<number | null>(null);
  private readonly selectedOptionSlug = signal<string | null>(null);
  private readonly selectedOffHandId = signal<number | null>(null);

  protected readonly effectiveArme = computed(() => {
    const list = this.displayArmes();
    const id = this.selectedArmeId();
    return list.find((a) => a.id === id) ?? list[0];
  });

  /** Postures visibles pour l'arme principale actuellement choisie — masque le combat à deux armes
   * tant qu'aucune autre arme légère/moyenne n'est disponible en second. */
  protected readonly visibleOptions = computed(() => {
    const otherDegats = this.eligibleOffHandArmes().map((a) => a.arme?.degats ?? null);
    return filterVisiblePostures(filterAttackMenuCombatOptions(this.combatOptions()), this.effectiveArme()?.arme?.degats ?? null, otherDegats);
  });

  protected readonly effectiveOption = computed(() => {
    const list = this.visibleOptions();
    const slug = this.selectedOptionSlug();
    return list.find((o) => o.slug === slug) ?? list[0] ?? null;
  });

  protected readonly isDualWieldSelected = computed(() => DUAL_WIELD_SLUGS.has(this.effectiveOption()?.slug ?? ''));

  /** Armes éligibles en second (légères/moyennes, hors l'arme principale actuellement choisie). */
  protected readonly eligibleOffHandArmes = computed(() => {
    const mainId = this.effectiveArme()?.id;
    return this.displayArmes().filter((a) => a.id !== mainId && isDualWieldEligible(a.arme?.degats));
  });

  protected readonly effectiveOffHand = computed(() => {
    const list = this.eligibleOffHandArmes();
    const id = this.selectedOffHandId();
    return list.find((a) => a.id === id) ?? list[0] ?? null;
  });

  /** "Cibler" reste désactivé si une posture à deux armes est choisie sans arme secondaire jouable. */
  protected readonly canConfirm = computed(() => !this.isDualWieldSelected() || !!this.effectiveOffHand());

  protected reset(): void {
    this.selectedArmeId.set(null);
    this.selectedOptionSlug.set(null);
    this.selectedOffHandId.set(null);
    this.opened.emit();
  }

  protected selectArme(id: number | undefined): void {
    this.selectedArmeId.set(id ?? null);
  }

  protected selectOption(slug: string): void {
    this.selectedOptionSlug.set(slug);
    if (!DUAL_WIELD_SLUGS.has(slug)) {
      this.selectedOffHandId.set(null);
    }
  }

  protected selectOffHand(id: number | undefined): void {
    this.selectedOffHandId.set(id ?? null);
  }

  protected confirm(): void {
    if (!this.canConfirm()) {
      return;
    }

    const option = this.effectiveOption();
    const mainDegats = this.effectiveArme()?.arme?.degats ?? null;
    const offHand = this.effectiveOffHand();
    const degats = option?.slug === 'dual-strike' && offHand ? dualStrikeDegats(mainDegats, offHand.arme?.degats) : mainDegats;

    this.confirmed.emit({
      degats,
      posture: option && option.slug !== 'none' ? option : null,
    });
  }
}
