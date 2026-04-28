import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CheckboxModule} from 'primeng/checkbox';
import {FieldsetModule} from 'primeng/fieldset';
import {InputNumberModule} from 'primeng/inputnumber';
import {InitiativeSlot, ReactionResult} from '../../bol-combat-panel';
import {RollEntry} from '../bol-roll-phase';
import {ValueStepperComponent} from '../../../../../shared/value-stepper/value-stepper';

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
  selector: 'app-rp-card',
  imports: [FormsModule, CheckboxModule, FieldsetModule, InputNumberModule, ValueStepperComponent],
  templateUrl: './rp-card.html',
  styleUrl: './rp-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RpCardComponent {
  readonly slot = input.required<InitiativeSlot>();
  readonly entry = input.required<RollEntry>();
  readonly isNext = input(false);

  readonly entryChange = output<Partial<RollEntry>>();

  protected readonly modTotal = computed(() => {
    const e = this.entry();
    return (e.surpris ? -1 : 0) + (e.embuscade ? 2 : 0) + e.carriere - e.initiativeEnnemie;
  });

  protected readonly total = computed(() => {
    const e = this.entry();
    if (e.dice === null) return null;
    return e.dice + e.esprit + e.bonusInit + this.modTotal();
  });

  protected readonly result = computed((): ReactionResult | null => {
    const e = this.entry();
    if (e.dice === null) return null;
    if (e.dice === 2) return e.acceptEchecCritique ? 'echec-critique' : 'echec';
    if (e.dice === 12) return e.depenseHeroisme ? 'legendaire' : 'heroique';
    const t = this.total();
    return t !== null ? (t >= 9 ? 'reussite' : 'echec') : null;
  });

  protected categoryLabel(category: ReactionResult): string {
    return CATEGORY_LABELS[category];
  }

  protected resetModifiers(): void {
    this.entryChange.emit({surpris: false, embuscade: false, carriere: 0, initiativeEnnemie: 0});
  }
}
