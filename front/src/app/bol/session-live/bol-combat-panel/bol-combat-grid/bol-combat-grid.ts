import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {MessageModule} from 'primeng/message';
import {SelectModule} from 'primeng/select';
import {InitiativeSlot} from '../bol-combat-panel';
import {CombatCardComponent} from './combat-card/combat-card';

@Component({
  selector: 'app-bol-combat-grid',
  imports: [FormsModule, ButtonModule, MessageModule, SelectModule, CombatCardComponent],
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
  readonly initiativeConfirmed = input.required<boolean>();
  readonly activeTurnId = input<string | null>(null);

  readonly selectedParticipantChange = output<string | null>();
  readonly addParticipant = output<void>();
  readonly hpChange = output<{id: string; delta: number}>();
  readonly heroismChange = output<{id: string; delta: number}>();
  readonly removeParticipant = output<string>();
  readonly attackStart = output<InitiativeSlot>();
  readonly delayTurn = output<string>();
  readonly defenseTotale = output<string>();
  readonly removeEtat = output<{slotId: string; etatId: string}>();
}
