import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {ButtonModule} from 'primeng/button';
import {PopoverModule} from 'primeng/popover';
import {TooltipModule} from 'primeng/tooltip';
import {EtatSlot, InitiativeSlot, ParticipantType, ReactionResult} from '../../bol-combat-panel';
import {CATEGORY_LABELS, TYPE_LABELS} from '../../combat.constants';

@Component({
  selector: 'app-combat-card',
  imports: [ButtonModule, PopoverModule, TooltipModule],
  templateUrl: './combat-card.html',
  styleUrl: './combat-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'combat-card',
    '[attr.data-type]': 'slot().type',
    '[attr.data-cat]': 'slot().category ?? "none"',
    '[class.combat-card--active]': 'isActiveTurn()',
  },
})
export class CombatCardComponent {
  readonly slot = input.required<InitiativeSlot>();
  readonly index = input.required<number>();
  readonly round1Blocked = input.required<boolean>();
  readonly initiativeConfirmed = input.required<boolean>();
  readonly isActiveTurn = input(false);

  readonly hpChange = output<{id: string; delta: number}>();
  readonly heroismChange = output<{id: string; delta: number}>();
  readonly removeParticipant = output<string>();
  readonly attackStart = output<InitiativeSlot>();
  readonly delayTurn = output<string>();
  readonly defenseTotale = output<string>();
  readonly removeEtat = output<{slotId: string; etatId: string}>();

  protected readonly hpRatio = computed(() => this.slot().vitaliteCourante / this.slot().vitaliteMax);

  protected readonly autoEtats = computed((): string[] => {
    const v = this.slot().vitaliteCourante;
    if (v < -5) return ['mort'];
    if (v < 0) return ['coma'];
    if (v === 0) return ['hors-combat'];
    return [];
  });

  protected readonly warningPouvoirs = computed(() =>
    this.slot().pouvoirs.filter((p) => p.avertissement_combat).map((p) => p.nom),
  );

  protected readonly showEquip = computed(() => {
    const s = this.slot();
    return s.armesList.length > 0 || s.armures.length > 0 || s.tags.length > 0 || s.pouvoirs.length > 0 || !!s.degats;
  });

  protected readonly showR1Block = computed(() => {
    const s = this.slot();
    return s.category === 'echec-critique' || (this.round1Blocked() && (s.category === 'coriace' || s.category === 'pietaille'));
  });

  protected readonly r1Tooltip = computed(() =>
    this.slot().category === 'echec-critique'
      ? 'Ne peut pas agir au round 1 — pas de bonus de bouclier en défense'
      : 'Ne joue pas au round 1',
  );

  protected typeLabel(type: ParticipantType): string {
    return TYPE_LABELS[type];
  }

  protected categoryLabel(category: ReactionResult): string {
    return CATEGORY_LABELS[category];
  }

  protected armeTooltip(arme: InitiativeSlot['armesList'][number]): string {
    const parts: string[] = [arme.type === 'T' ? 'Tir' : 'Mêlée'];
    if (arme.portee) parts.push(`Portée : ${arme.portee}`);
    if (arme.notes) parts.push(arme.notes);
    return parts.join('\n');
  }

  protected etatLabel(etat: EtatSlot): string {
    const labels: Record<EtatSlot['type'], string> = {
      'posture-off':    'Off.',
      'posture-def':    'Déf.',
      'defense-totale': 'Déf. totale',
      'intrepide':      'Intrépide',
      'a-terre':        'À terre',
      'desarme':        'Désarmé',
      'de-malus':       etat.note ?? 'Dé malus',
      'stabilise':      'Stabilisé',
    };
    return labels[etat.type];
  }

  protected armureTooltip(armure: InitiativeSlot['armures'][number]): string {
    const parts: string[] = [armure.nom];
    if (armure.protection) parts.push(`Protection : ${armure.protection}`);
    if (armure.malus) parts.push(`Malus : ${armure.malus}`);
    return parts.join('\n');
  }
}
