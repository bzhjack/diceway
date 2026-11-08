import {effect, Injectable, inject, signal} from '@angular/core';
import {forkJoin} from 'rxjs';
import {creatureImage} from '../creature/creature.util';
import {demonImage} from '../demon/demon.util';
import {heroImage} from '../hero/hero.util';
import {pnjImage} from '../pnj/pnj.util';
import {BolCreaturesService} from './bol-creatures.service';
import {BolDemonsService} from './bol-demons.service';
import {BolHerosService} from './bol-heros.service';
import {BolPnjService} from './bol-pnj.service';
import {CombatantKind, CombatCatalogEntry, SelectedCombatant} from '../models/combat-selection.model';

const STACKABLE_KINDS: ReadonlySet<CombatantKind> = new Set(['creature', 'demon']);

/** Brouillon de sélection persisté côté client (localStorage) pour survivre à un F5 ou une navigation. */
const STORAGE_KEY = 'diceway-combat-selection';

interface PersistedDraft {
  readonly combatants: SelectedCombatant[];
}

function restoreDraft(): PersistedDraft {
  const empty: PersistedDraft = {combatants: []};

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return empty;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return empty;
    }

    const obj = parsed as Partial<PersistedDraft>;
    const combatants = Array.isArray(obj.combatants)
      ? obj.combatants.filter((c): c is SelectedCombatant => {
          const entry = c as Partial<SelectedCombatant> | null;
          return (
            typeof entry === 'object' && entry !== null && typeof entry.catalogId === 'string' && typeof entry.qty === 'number'
          );
        })
      : [];
    return {combatants};
  } catch {
    return empty;
  }
}

/** État de sélection des combattants (catalogue + brouillon) pour l'écran de préparation de combat. */
@Injectable({providedIn: 'root'})
export class CombatSelectionService {
  private readonly herosService = inject(BolHerosService);
  private readonly pnjService = inject(BolPnjService);
  private readonly creaturesService = inject(BolCreaturesService);
  private readonly demonsService = inject(BolDemonsService);

  readonly catalog = signal<readonly CombatCatalogEntry[]>([]);
  readonly loading = signal(false);
  /** Le dernier chargement du catalogue a échoué : le catalogue gardé (peut-être vide) n'est pas à jour. */
  readonly loadFailed = signal(false);

  private readonly initialDraft = restoreDraft();
  readonly combatants = signal<readonly SelectedCombatant[]>(this.initialDraft.combatants);

  constructor() {
    effect(() => {
      const draft: PersistedDraft = {
        combatants: this.combatants() as SelectedCombatant[],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    });
  }

  /** Recharge le catalogue à chaque visite de l'écran de sélection (les fiches ont pu changer entre-temps). */
  loadCatalog(): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.loadFailed.set(false);
    forkJoin({
      heroes: this.herosService.heroes(),
      pnjs: this.pnjService.pnjs(),
      creatures: this.creaturesService.creatures(),
      demons: this.demonsService.demons(),
    }).subscribe({
      next: ({heroes, pnjs, creatures, demons}) => {
        const entries: CombatCatalogEntry[] = [
          ...heroes
            .filter((h) => h.id)
            .map((h) => ({
              catalogId: `hero:${h.id}`,
              kind: 'hero' as const,
              sourceId: h.id!,
              nom: h.origines.nom ?? 'Héros',
              vitalite: h.ressources.vitalite,
              avatar: heroImage(h),
              raw: h,
            })),
          ...pnjs
            .filter((p) => p.id)
            .map((p) => ({
              catalogId: `pnj:${p.id}`,
              kind: 'pnj' as const,
              sourceId: p.id!,
              nom: p.origines.nom ?? 'PNJ',
              vitalite: p.ressources.vitalite,
              avatar: pnjImage(p),
              raw: p,
            })),
          ...creatures
            .filter((c) => c.id)
            .map((c) => ({
              catalogId: `creature:${c.id}`,
              kind: 'creature' as const,
              sourceId: c.id!,
              nom: c.nom,
              vitalite: c.vitalite,
              avatar: creatureImage(c),
              raw: c,
            })),
          ...demons
            .filter((d) => d.id)
            .map((d) => ({
              catalogId: `demon:${d.id}`,
              kind: 'demon' as const,
              sourceId: d.id!,
              nom: d.nom,
              vitalite: d.vitalite,
              avatar: demonImage(d),
              raw: d,
            })),
        ];

        this.catalog.set(entries);
        this.loading.set(false);
      },
      // Sans cela `loading` restait levé pour toujours : plus aucun rechargement possible, et rien pour le dire à l'écran.
      error: () => {
        this.loading.set(false);
        this.loadFailed.set(true);
      },
    });
  }

  entryFor(catalogId: string): CombatCatalogEntry | undefined {
    return this.catalog().find((entry) => entry.catalogId === catalogId);
  }

  combatantFor(catalogId: string): SelectedCombatant | undefined {
    return this.combatants().find((c) => c.catalogId === catalogId);
  }

  isStackable(kind: CombatantKind): boolean {
    return STACKABLE_KINDS.has(kind);
  }

  add(catalogId: string): void {
    const entry = this.entryFor(catalogId);
    if (!entry) {
      return;
    }

    const existing = this.combatantFor(catalogId);
    if (existing) {
      if (this.isStackable(entry.kind)) {
        this.incQty(catalogId);
      }
      return;
    }

    this.combatants.update((list) => [...list, {catalogId, qty: 1}]);
  }

  private incQty(catalogId: string): void {
    this.combatants.update((list) => list.map((c) => (c.catalogId === catalogId ? {...c, qty: c.qty + 1} : c)));
  }

  remove(catalogId: string): void {
    this.combatants.update((list) => list.filter((c) => c.catalogId !== catalogId));
  }

  reset(): void {
    this.combatants.set([]);
  }
}
