import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {BolCreatureModel} from '../../models/bol-creature.model';

interface CreatureStatValue {
  readonly label: string;
  readonly value: string | number;
}

@Component({
  selector: 'bol-creature-statblock',
  templateUrl: './creature-statblock.component.html',
  styleUrl: './creature-statblock.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class CreatureStatblockComponent {
  readonly creature = input.required<BolCreatureModel>();
  readonly imageSrc = input.required<string>();

  protected readonly attributeEntries = computed<readonly CreatureStatValue[]>(() => [
    {label: 'Vigueur', value: this.creature().vigueur},
    {label: 'Agilité', value: this.creature().agilite},
    {label: 'Esprit', value: this.creature().esprit},
  ]);

  protected readonly combatEntries = computed<readonly CreatureStatValue[]>(() => [
    {label: 'Attaque', value: this.creature().attaque},
    {label: 'Défense', value: this.creature().defense},
    {label: 'Dégâts', value: this.creature().degats},
    {label: 'Protection', value: this.creature().protection},
  ]);

  protected readonly resourceEntries = computed<readonly CreatureStatValue[]>(() => [
    {label: 'Vitalité', value: this.creature().vitalite},
    {label: 'Déplacement', value: this.creature().taille.deplacement || '-'},
  ]);

}
