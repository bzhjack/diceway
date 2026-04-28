import {ChangeDetectionStrategy, Component, OnInit, computed, input, output, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {CheckboxModule} from 'primeng/checkbox';
import {FieldsetModule} from 'primeng/fieldset';
import {InputNumberModule} from 'primeng/inputnumber';
import {InitiativeSlot, ReactionResult} from '../bol-combat-panel';
import {ValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';

interface RollEntry {
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
  imports: [
    FormsModule,
    ButtonModule,
    CheckboxModule,
    InputNumberModule,
    FieldsetModule,
    ValueStepperComponent,
  ],
  templateUrl: './bol-roll-phase.html',
  styleUrl: './bol-roll-phase.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BolRollPhaseComponent implements OnInit {
  readonly heroesInOrder = input.required<InitiativeSlot[]>();
  readonly nonHeroesInOrder = input.required<InitiativeSlot[]>();

  readonly cancelled = output<void>();
  readonly confirmed = output<{id: string; category: ReactionResult}[]>();

  protected readonly rollEntries = signal<Record<string, RollEntry>>({});

  protected readonly rolledHeroesCount = computed(
    () => this.heroesInOrder().filter((s) => this.rollEntries()[s.id]?.dice != null).length,
  );

  protected readonly nextPendingHeroId = computed(
    () => this.heroesInOrder().find((s) => this.rollEntries()[s.id]?.dice == null)?.id ?? null,
  );

  protected readonly allHeroesRolled = computed(() =>
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

  protected resetModifiers(id: string): void {
    this.updateEntry(id, {
      surpris: false,
      embuscade: false,
      carriere: 0,
      initiativeEnnemie: 0,
    });
  }

  protected resetAllModifiers(): void {
    const current = this.rollEntries();
    const next: Record<string, RollEntry> = {};
    for (const slot of this.heroesInOrder()) {
      const entry = current[slot.id] ?? DEFAULT_ROLL_ENTRY;
      next[slot.id] = {
        ...entry,
        surpris: false,
        embuscade: false,
        carriere: 0,
        initiativeEnnemie: 0,
      };
    }
    this.rollEntries.set(next);
  }

  protected rollTotal(id: string): number | null {
    const e = this.getEntry(id);
    if (e.dice === null) return null;
    return (
      e.dice +
      e.esprit +
      e.bonusInit +
      (e.surpris ? -1 : 0) +
      (e.embuscade ? 2 : 0) +
      e.carriere -
      e.initiativeEnnemie
    );
  }

  protected rollResultFor(id: string): ReactionResult | null {
    const e = this.getEntry(id);
    if (e.dice === null) return null;
    if (e.dice === 2) return e.acceptEchecCritique ? 'echec-critique' : 'echec';
    if (e.dice === 12) return e.depenseHeroisme ? 'legendaire' : 'heroique';
    const total = this.rollTotal(id);
    if (total === null) return null;
    return total >= 9 ? 'reussite' : 'echec';
  }

  protected categoryLabel(category: ReactionResult): string {
    return CATEGORY_LABELS[category];
  }

  protected confirm(): void {
    const results = this.heroesInOrder()
      .map((s) => ({id: s.id, category: this.rollResultFor(s.id)}))
      .filter((r): r is {id: string; category: ReactionResult} => r.category !== null);
    this.confirmed.emit(results);
  }
}
