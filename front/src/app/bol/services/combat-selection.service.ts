import {effect, Injectable, inject, signal} from '@angular/core';
import {Observable, forkJoin} from 'rxjs';
import {creatureImage} from '../creature/library/creature-card/creature-card.component';
import {demonImage} from '../demon/library/demon-card/demon-card.component';
import {heroImage} from '../hero/library/hero-card/hero-card.component';
import {pnjImage} from '../pnj/library/pnj-card/pnj-card.component';
import {BolCreatureModel} from '../models/bol-creature.model';
import {BolDemonModel} from '../models/bol-demon.model';
import {BolHerosModel} from '../models/bol-heros.model';
import {BolCreaturesService} from './bol-creatures.service';
import {BolDemonsService} from './bol-demons.service';
import {BolFightSessionService} from './bol-fight-session.service';
import {BolHerosService} from './bol-heros.service';
import {BolPnjService} from './bol-pnj.service';
import {BolFightSessionCreatePayload, BolFightSessionModel, CombatCamp} from '../models/bol-fight-session.model';

export type CombatantKind = 'hero' | 'pnj' | 'creature' | 'demon';

export interface CombatCatalogEntry {
  readonly catalogId: string;
  readonly kind: CombatantKind;
  readonly sourceId: string;
  readonly nom: string;
  readonly vitalite: number;
  readonly avatar: string;
  /** Modèle complet, conservé pour alimenter le statbloc sans le recharger. */
  readonly raw: BolHerosModel | BolCreatureModel | BolDemonModel;
}

export interface SelectedCombatant {
  readonly catalogId: string;
  readonly qty: number;
}

/**
 * Notion de camp mise de côté côté IHM pour l'instant (une seule zone
 * combattants) — le backend l'exige encore, donc on l'assigne par défaut
 * selon le type (héros joueurs -> 'heros', tout le reste -> 'adversaires').
 */
function defaultCampFor(kind: CombatantKind): CombatCamp {
  return kind === 'hero' ? 'heros' : 'adversaires';
}

const STACKABLE_KINDS: ReadonlySet<CombatantKind> = new Set(['creature', 'demon']);

/** Brouillon de sélection persisté côté client (localStorage) pour survivre à un F5 ou une navigation. */
const STORAGE_KEY = 'diceway-combat-selection';

function restoreCombatants(): SelectedCombatant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((c): c is SelectedCombatant => {
      const entry = c as Partial<SelectedCombatant> | null;
      return typeof entry === 'object' && entry !== null && typeof entry.catalogId === 'string' && typeof entry.qty === 'number';
    });
  } catch {
    return [];
  }
}

/** État de sélection des combattants (catalogue + brouillon) pour l'écran de préparation de combat. */
@Injectable({providedIn: 'root'})
export class CombatSelectionService {
  private readonly herosService = inject(BolHerosService);
  private readonly pnjService = inject(BolPnjService);
  private readonly creaturesService = inject(BolCreaturesService);
  private readonly demonsService = inject(BolDemonsService);
  private readonly fightSessionService = inject(BolFightSessionService);

  readonly catalog = signal<readonly CombatCatalogEntry[]>([]);
  readonly loading = signal(false);
  readonly combatants = signal<readonly SelectedCombatant[]>(restoreCombatants());

  constructor() {
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.combatants()));
    });
  }

  loadCatalog(): void {
    if (this.catalog().length || this.loading()) {
      return;
    }

    this.loading.set(true);
    forkJoin({
      heroes: this.herosService.heroes(),
      pnjs: this.pnjService.pnjs(),
      creatures: this.creaturesService.creatures(),
      demons: this.demonsService.demons(),
    }).subscribe(({heroes, pnjs, creatures, demons}) => {
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

  incQty(catalogId: string): void {
    this.combatants.update((list) => list.map((c) => (c.catalogId === catalogId ? {...c, qty: c.qty + 1} : c)));
  }

  decQty(catalogId: string): void {
    this.combatants.update((list) => {
      const target = list.find((c) => c.catalogId === catalogId);
      if (!target) {
        return list;
      }
      if (target.qty <= 1) {
        return list.filter((c) => c.catalogId !== catalogId);
      }
      return list.map((c) => (c.catalogId === catalogId ? {...c, qty: c.qty - 1} : c));
    });
  }

  remove(catalogId: string): void {
    this.combatants.update((list) => list.filter((c) => c.catalogId !== catalogId));
  }

  reset(): void {
    this.combatants.set([]);
  }

  launch(titre?: string | null): Observable<BolFightSessionModel> {
    return this.fightSessionService.create(this.buildCreatePayload(titre));
  }

  private buildCreatePayload(titre?: string | null): BolFightSessionCreatePayload {
    const byKind = (kind: CombatantKind) =>
      this.combatants().filter((c) => this.entryFor(c.catalogId)?.kind === kind);

    return {
      titre: titre ?? null,
      heros: byKind('hero').map((c) => ({heroId: this.entryFor(c.catalogId)!.sourceId, camp: defaultCampFor('hero')})),
      pnjs: byKind('pnj').map((c) => ({pnjId: this.entryFor(c.catalogId)!.sourceId, camp: defaultCampFor('pnj')})),
      creatures: byKind('creature').map((c) => ({
        creatureId: this.entryFor(c.catalogId)!.sourceId,
        camp: defaultCampFor('creature'),
        qty: c.qty,
      })),
      demons: byKind('demon').map((c) => ({
        demonId: this.entryFor(c.catalogId)!.sourceId,
        camp: defaultCampFor('demon'),
        qty: c.qty,
      })),
    };
  }
}
