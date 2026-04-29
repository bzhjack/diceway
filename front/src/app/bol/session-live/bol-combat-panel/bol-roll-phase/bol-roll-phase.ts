import {ChangeDetectionStrategy, Component, OnInit, computed, effect, input, output, signal} from '@angular/core';
import {InitiativeSlot, ReactionResult} from '../bol-combat-panel';
import {RpCardComponent} from './rp-card/rp-card';

export interface RollEntry {
  esprit: number;
  bonusInit: number;
  dice: number | null;
  surpris: boolean;
  embuscade: boolean;
  carriere: number;
  initiativeEnnemie: number;
  acceptEchecCritique: boolean;
  depenseHeroisme: boolean;
}

const DEFAULT_ROLL_ENTRY: RollEntry = {
  esprit: 0,
  bonusInit: 0,
  dice: null,
  surpris: false,
  embuscade: false,
  carriere: 0,
  initiativeEnnemie: 0,
  acceptEchecCritique: false,
  depenseHeroisme: false,
};

const CATEGORY_LABELS: Record<ReactionResult, string> = {
  legendaire: 'Légendaire ★★',
  heroique: 'Héroïque ★',
  reussite: 'Réussite',
  rival: 'Rival',
  coriace: 'Coriace',
  echec: 'Échec',
  pietaille: 'Piétaille',
  'echec-critique': 'Échec critique',
};

@Component({
  selector: 'app-bol-roll-phase',
  imports: [RpCardComponent],
  templateUrl: './bol-roll-phase.html',
  styleUrl: './bol-roll-phase.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BolRollPhaseComponent implements OnInit {
  readonly heroesInOrder = input.required<InitiativeSlot[]>();
  readonly nonHeroesInOrder = input.required<InitiativeSlot[]>();

  readonly cancelled = output<void>();
  readonly confirmed = output<{id: string; category: ReactionResult}[]>();
  readonly allHeroesRolledChange = output<boolean>();

  protected readonly rollEntries = signal<Record<string, RollEntry>>({});

  constructor() {
    effect(() => this.allHeroesRolledChange.emit(this.allHeroesRolled()));
  }

  protected readonly rolledHeroesCount = computed(
    () => this.heroesInOrder().filter((s) => this.rollEntries()[s.id]?.dice != null).length,
  );

  protected readonly nextPendingHeroId = computed(
    () => this.heroesInOrder().find((s) => this.rollEntries()[s.id]?.dice == null)?.id ?? null,
  );

  readonly allHeroesRolled = computed(() =>
    this.rolledHeroesCount() === this.heroesInOrder().length,
  );

  ngOnInit(): void {
    const entries: Record<string, RollEntry> = {};
    for (const slot of this.heroesInOrder()) {
      entries[slot.id] = {
        ...DEFAULT_ROLL_ENTRY,
        esprit: slot.esprit ?? 0,
        bonusInit: slot.initiative ?? 0,
      };
    }
    this.rollEntries.set(entries);
  }

  protected getEntry(id: string): RollEntry {
    return this.rollEntries()[id] ?? DEFAULT_ROLL_ENTRY;
  }

  protected updateEntry(id: string, patch: Partial<RollEntry>): void {
    this.rollEntries.update((r) => ({
      ...r,
      [id]: {...this.getEntry(id), ...patch},
    }));
  }

  protected categoryLabel(category: ReactionResult): string {
    return CATEGORY_LABELS[category];
  }

  confirm(): void {
    const results = this.heroesInOrder()
      .map((s) => {
        const e = this.getEntry(s.id);
        if (e.dice === null) return null;
        let category: ReactionResult;
        if (e.dice === 2) category = e.acceptEchecCritique ? 'echec-critique' : 'echec';
        else if (e.dice === 12) category = e.depenseHeroisme ? 'legendaire' : 'heroique';
        else {
          const total = e.dice + e.esprit + e.bonusInit + (e.surpris ? -1 : 0) + (e.embuscade ? 2 : 0) + e.carriere - e.initiativeEnnemie;
          category = total >= 9 ? 'reussite' : 'echec';
        }
        return {id: s.id, category};
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
    this.confirmed.emit(results);
  }
}
