import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {MessageModule} from 'primeng/message';
import {SelectModule} from 'primeng/select';
import {TooltipModule} from 'primeng/tooltip';
import {InitiativeSlot, ParticipantType, ReactionResult} from '../bol-combat-panel';

const TYPE_LABELS: Record<ParticipantType, string> = {
  hero: 'PJ',
  creature: 'Créature',
  demon: 'Démon',
  pnj: 'PNJ',
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
  selector: 'app-bol-combat-grid',
  imports: [FormsModule, ButtonModule, MessageModule, SelectModule, TooltipModule],
  templateUrl: './bol-combat-grid.html',
  styleUrl: './bol-combat-grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BolCombatGridComponent {
  readonly sortedInitiative = input.required<InitiativeSlot[]>();
  readonly availableParticipantOptions = input.required<{label: string; value: string}[]>();
  readonly selectedParticipantId = input<string | null>(null);
  readonly round1Blocked = input.required<boolean>();
  readonly legendaryBonus = input.required<boolean>();

  readonly selectedParticipantChange = output<string | null>();
  readonly addParticipant = output<void>();
  readonly hpChange = output<{id: string; delta: number}>();
  readonly heroismChange = output<{id: string; delta: number}>();
  readonly removeParticipant = output<string>();
  readonly attackStart = output<InitiativeSlot>();

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

  protected autoEtats(slot: InitiativeSlot): string[] {
    const v = slot.vitaliteCourante;
    if (v < -5) return ['mort'];
    if (v < 0) return ['coma'];
    if (v === 0) return ['hors-combat'];
    return [];
  }

  protected armureTooltip(armure: InitiativeSlot['armures'][number]): string {
    const parts: string[] = [armure.nom];
    if (armure.protection) parts.push(`Protection : ${armure.protection}`);
    if (armure.malus) parts.push(`Malus : ${armure.malus}`);
    return parts.join('\n');
  }
}
