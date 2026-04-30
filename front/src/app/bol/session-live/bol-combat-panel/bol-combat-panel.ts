import {ChangeDetectionStrategy, Component, computed, input, signal, viewChild} from '@angular/core';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {DialogModule} from 'primeng/dialog';
import {BolAttackAssistantComponent} from './bol-attack-assistant/bol-attack-assistant';
import {BolCombatGridComponent} from './bol-combat-grid/bol-combat-grid';
import {BolRollPhaseComponent} from './bol-roll-phase/bol-roll-phase';

export type ParticipantType = 'hero' | 'creature' | 'demon' | 'pnj';
export type ReactionResult =
  | 'legendaire'
  | 'heroique'
  | 'reussite'
  | 'rival'
  | 'coriace'
  | 'echec'
  | 'pietaille'
  | 'echec-critique';

export interface InitiativeSlot {
  readonly id: string;
  readonly nom: string;
  readonly avatar: string | null;
  readonly type: ParticipantType;
  readonly vitaliteMax: number;
  readonly heroismMax: number | null;
  readonly agilite: number | null;
  readonly esprit: number | null;
  readonly initiative: number | null;
  readonly melee: number | null;
  readonly tir: number | null;
  readonly defense: number | null;
  readonly degats: string | null;
  readonly tags: string[];
  readonly pouvoirs: string[];
  readonly armesList: {nom: string; degats: string | null; type: 'M' | 'T' | null; portee: string | null; notes: string | null}[];
  readonly armures: {nom: string; protection: string | null; malus: string | null}[];
  category: ReactionResult | null;
  vitaliteCourante: number;
  heroismCourant: number | null;
}

const TYPE_LABELS: Record<ParticipantType, string> = {
  hero: 'PJ',
  creature: 'Créature',
  demon: 'Démon',
  pnj: 'PNJ',
};

const INITIATIVE_ORDER: Record<ReactionResult, number> = {
  legendaire: 0,
  heroique: 1,
  reussite: 2,
  rival: 3,
  coriace: 4,
  echec: 5,
  pietaille: 6,
  'echec-critique': 7,
};

@Component({
  selector: 'app-bol-combat-panel',
  imports: [ButtonModule, CardModule, DialogModule, BolAttackAssistantComponent, BolCombatGridComponent, BolRollPhaseComponent],
  templateUrl: './bol-combat-panel.html',
  styleUrl: './bol-combat-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BolCombatPanelComponent {
  readonly participants = input.required<InitiativeSlot[]>();

  private readonly rollPhaseRef = viewChild(BolRollPhaseComponent);

  protected readonly initiativeOrder = signal<InitiativeSlot[]>([]);
  protected readonly attackerSlot = signal<InitiativeSlot | null>(null);
  protected readonly selectedParticipantId = signal<string | null>(null);
  protected readonly rollPhase = signal(false);
  protected readonly rulesDialogVisible = signal(false);
  protected readonly allHeroesRolled = signal(false);
  protected readonly currentRound = signal(1);

  protected readonly availableParticipants = computed(() => {
    const inOrder = new Set(this.initiativeOrder().map((s) => s.id));
    return this.participants().filter((p) => !inOrder.has(p.id));
  });

  protected readonly availableParticipantOptions = computed(() =>
    this.availableParticipants().map((p) => ({
      label: `${p.nom} — ${TYPE_LABELS[p.type]}`,
      value: p.id,
    })),
  );

  protected readonly sortedInitiative = computed(() =>
    [...this.initiativeOrder()].sort((a, b) => {
      const orderA = a.category != null ? INITIATIVE_ORDER[a.category] : 99;
      const orderB = b.category != null ? INITIATIVE_ORDER[b.category] : 99;
      return orderA - orderB;
    }),
  );

  protected readonly round1Blocked = computed(() =>
    this.initiativeOrder().some(
      (s) => s.type === 'hero' && (s.category === 'heroique' || s.category === 'legendaire'),
    ),
  );

  protected readonly legendaryBonus = computed(() =>
    this.initiativeOrder().some((s) => s.type === 'hero' && s.category === 'legendaire'),
  );

  protected readonly heroesInOrder = computed(() =>
    this.initiativeOrder().filter((s) => s.type === 'hero'),
  );

  protected readonly initiativeConfirmed = computed(() =>
    this.heroesInOrder().length > 0 && this.heroesInOrder().every((s) => s.category !== null),
  );

  protected readonly nonHeroesInOrder = computed(() =>
    this.initiativeOrder().filter((s) => s.type !== 'hero'),
  );

  protected addToInitiative(): void {
    const id = this.selectedParticipantId();
    if (!id) return;
    const participant = this.participants().find((p) => p.id === id);
    if (!participant) return;
    this.initiativeOrder.update((list) => [...list, participant]);
    const next = this.availableParticipants().find((p) => p.id !== id);
    this.selectedParticipantId.set(next?.id ?? null);
  }

  protected adjustHp(id: string, delta: number): void {
    this.initiativeOrder.update((list) =>
      list.map((s) =>
        s.id === id
          ? {...s, vitaliteCourante: Math.max(-10, Math.min(s.vitaliteMax, s.vitaliteCourante + delta))}
          : s,
      ),
    );
  }

  protected adjustHeroism(id: string, delta: number): void {
    this.initiativeOrder.update((list) =>
      list.map((s) =>
        s.id === id && s.heroismMax != null
          ? {...s, heroismCourant: Math.max(0, Math.min(s.heroismMax, (s.heroismCourant ?? 0) + delta))}
          : s,
      ),
    );
  }

  protected removeFromInitiative(id: string): void {
    this.initiativeOrder.update((list) => list.filter((s) => s.id !== id));
  }

  protected startRollPhase(): void {
    this.allHeroesRolled.set(false);
    this.rollPhase.set(true);
  }

  protected startNewRound(): void {
    this.initiativeOrder.update((list) =>
      list.map((s) => {
        let next = s.vitaliteCourante < 0 ? {...s, vitaliteCourante: s.vitaliteCourante - 1} : s;
        if (next.pouvoirs.includes('Régénération')) {
          next = {...next, vitaliteCourante: Math.min(next.vitaliteMax, next.vitaliteCourante + 1)};
        }
        return next;
      }),
    );
    this.currentRound.update((r) => r + 1);
  }

  protected cancelRollPhase(): void {
    this.allHeroesRolled.set(false);
    this.rollPhase.set(false);
  }

  protected confirmRollPhase(): void {
    this.rollPhaseRef()?.confirm();
  }

  protected onRollConfirmed(results: {id: string; category: ReactionResult}[]): void {
    this.initiativeOrder.update((list) =>
      list.map((s) => {
        const result = results.find((r) => r.id === s.id);
        return result ? {...s, category: result.category} : s;
      }),
    );
    this.allHeroesRolled.set(false);
    this.rollPhase.set(false);
  }
}
