import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {BolDemonModel} from '../../models/bol-demon.model';

interface DemonStatValue {
  readonly label: string;
  readonly value: string | number;
}

@Component({
  selector: 'bol-demon-statblock',
  templateUrl: './demon-statblock.component.html',
  styleUrl: './demon-statblock.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemonStatblockComponent {
  readonly demon = input.required<BolDemonModel>();
  readonly imageSrc = input.required<string>();

  protected readonly attributeEntries = computed<readonly DemonStatValue[]>(() => [
    {label: 'Vigueur', value: this.demon().vigueur},
    {label: 'Agilité', value: this.demon().agilite},
    {label: 'Esprit', value: this.demon().esprit},
    {label: 'Aura', value: this.demon().aura},
  ]);

  protected readonly combatEntries = computed<readonly DemonStatValue[]>(() => [
    {label: 'Mêlée', value: this.demon().melee},
    {label: 'Tir', value: this.demon().tir},
    {label: 'Défense', value: this.demon().defense},
    {label: 'Dégâts', value: this.demon().degats},
  ]);

  protected readonly resourceEntries = computed<readonly DemonStatValue[]>(() => [
    {label: 'Vitalité', value: this.demon().vitalite},
  ]);
}
