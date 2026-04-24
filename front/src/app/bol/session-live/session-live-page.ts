import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {of, switchMap} from 'rxjs';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {SelectModule} from 'primeng/select';
import {TagModule} from 'primeng/tag';
import {BolScenarioService} from '../services/bol-scenario.service';

type ParticipantType = 'hero' | 'creature' | 'demon' | 'pnj';
type ReactionResult =
  | 'legendaire'
  | 'heroique'
  | 'reussite'
  | 'rival'
  | 'coriace'
  | 'echec'
  | 'pietaille'
  | 'echec-critique';

interface CategoryOption {
  readonly label: string;
  readonly value: ReactionResult;
}

interface InitiativeSlot {
  readonly id: string;
  readonly nom: string;
  readonly type: ParticipantType;
  category: ReactionResult | null;
}

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

const HERO_OPTIONS: readonly CategoryOption[] = [
  {label: 'Lég. ★★', value: 'legendaire'},
  {label: 'Hér. ★', value: 'heroique'},
  {label: 'Réussite', value: 'reussite'},
  {label: 'Échec', value: 'echec'},
  {label: 'Éch. crit.', value: 'echec-critique'},
];

const ANTAGONIST_OPTIONS: readonly CategoryOption[] = [
  {label: 'Rival', value: 'rival'},
  {label: 'Coriace', value: 'coriace'},
  {label: 'Piétaille', value: 'pietaille'},
];

const TYPE_LABELS: Record<ParticipantType, string> = {
  hero: 'PJ',
  creature: 'Créature',
  demon: 'Démon',
  pnj: 'PNJ',
};

@Component({
  selector: 'app-session-live-page',
  imports: [RouterLink, FormsModule, ButtonModule, CardModule, SelectModule, TagModule],
  templateUrl: './session-live-page.html',
  styleUrl: './session-live-page.scss',
  host: {class: 'block'},
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionLivePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly scenarioService = inject(BolScenarioService);

  protected readonly combatMode = signal(false);

  protected readonly scenario = toSignal(
    this.route.queryParamMap.pipe(
      switchMap((params) => {
        const id = params.get('scenarioId');
        return id ? this.scenarioService.scenario(id) : of(null);
      }),
    ),
  );

  protected readonly allParticipants = signal<InitiativeSlot[]>([]);
  protected readonly initiativeOrder = signal<InitiativeSlot[]>([]);
  protected readonly selectedParticipantId = signal<string | null>(null);

  protected readonly availableParticipants = computed(() => {
    const inOrder = new Set(this.initiativeOrder().map((s) => s.id));
    return this.allParticipants().filter((p) => !inOrder.has(p.id));
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

  protected readonly heroOptions: readonly CategoryOption[] = HERO_OPTIONS;
  protected readonly antagonistOptions: readonly CategoryOption[] = ANTAGONIST_OPTIONS;

  protected categoryOptionsFor(type: ParticipantType): readonly CategoryOption[] {
    return type === 'hero' ? HERO_OPTIONS : ANTAGONIST_OPTIONS;
  }

  protected startCombat(): void {
    const s = this.scenario();
    if (!s) return;

    const all: InitiativeSlot[] = [
      ...(s.pj ?? []).map((pj): InitiativeSlot => ({
        id: `hero-${pj.id}`,
        nom: pj.heros?.origines.nom ?? 'Héros',
        type: 'hero',
        category: null,
      })),
      ...(s.creatures ?? []).map((c): InitiativeSlot => ({
        id: `creature-${c.id}`,
        nom: c.surnom ?? c.nom,
        type: 'creature',
        category: c.rang,
      })),
      ...(s.demons ?? []).map((d): InitiativeSlot => ({
        id: `demon-${d.id}`,
        nom: d.surnom ?? d.nom,
        type: 'demon',
        category: d.rang,
      })),
      ...(s.pnjs ?? []).map((p): InitiativeSlot => ({
        id: `pnj-${p.id}`,
        nom: p.surnom ?? p.nom,
        type: 'pnj',
        category: p.rang,
      })),
    ];

    this.allParticipants.set(all);
    this.initiativeOrder.set([]);
    this.selectedParticipantId.set(all[0]?.id ?? null);
    this.combatMode.set(true);
  }

  protected stopCombat(): void {
    this.combatMode.set(false);
    this.allParticipants.set([]);
    this.initiativeOrder.set([]);
    this.selectedParticipantId.set(null);
  }

  protected addToInitiative(): void {
    const id = this.selectedParticipantId();
    if (!id) return;
    const participant = this.allParticipants().find((p) => p.id === id);
    if (!participant) return;
    this.initiativeOrder.update((list) => [...list, {...participant, category: null}]);
    const next = this.availableParticipants().find((p) => p.id !== id);
    this.selectedParticipantId.set(next?.id ?? null);
  }

  protected removeFromInitiative(id: string): void {
    this.initiativeOrder.update((list) => list.filter((s) => s.id !== id));
  }

  protected setCategory(id: string, category: ReactionResult): void {
    this.initiativeOrder.update((list) =>
      list.map((s) =>
        s.id === id ? {...s, category: s.category === category ? null : category} : s,
      ),
    );
  }
}
