import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {BolHerosModel} from '../../models/bol-heros.model';
import {BolHerosArmureModel} from '../../models/bol-armure.model';
import {BolHerosArmeModel} from '../../models/bol-arme.model';
import {EntityCardBadge} from '../../shared/entity-card/entity-card.component';
import {pnjBadge} from '../library/pnj-card/pnj-card.component';

interface PnjStatValue {
  readonly label: string;
  readonly value: string | number;
}

interface PnjCareerEntry {
  readonly label: string;
  readonly value: number;
}

interface PnjListEntry {
  readonly label: string;
  readonly detail: string;
}

@Component({
  selector: 'bol-pnj-statblock',
  templateUrl: './pnj-statblock.component.html',
  styleUrl: './pnj-statblock.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PnjStatblockComponent {
  readonly pnj = input.required<BolHerosModel>();
  readonly imageSrc = input.required<string>();

  protected readonly badge = computed<EntityCardBadge | null>(() => pnjBadge(this.pnj()));

  protected readonly resourceEntries = computed<readonly PnjStatValue[]>(() => {
    const entries: PnjStatValue[] = [{label: 'Vitalité', value: this.pnj().ressources.vitalite}];

    if (this.pnj().ressources.heroisme > 0) {
      entries.push({label: 'Héroïsme', value: this.pnj().ressources.heroisme});
    }

    return entries;
  });

  protected readonly attributeEntries = computed<readonly PnjStatValue[]>(() => [
    {label: 'Vigueur', value: this.pnj().attributs.vigueur},
    {label: 'Agilité', value: this.pnj().attributs.agilite},
    {label: 'Esprit', value: this.pnj().attributs.esprit},
    {label: 'Aura', value: this.pnj().attributs.aura},
  ]);

  protected readonly combatEntries = computed<readonly PnjStatValue[]>(() => [
    {label: 'Initiative', value: this.pnj().combat.initiative},
    {label: 'Mêlée', value: this.pnj().combat.melee},
    {label: 'Tir', value: this.pnj().combat.tir},
    {label: 'Défense', value: this.pnj().combat.defense},
  ]);

  protected readonly careerEntries = computed<readonly PnjCareerEntry[]>(() =>
    this.pnj()
      .carrieres.map((carriere) => ({label: carriere.carriere?.carriere ?? '', value: carriere.value}))
      .filter((entry) => entry.label),
  );

  protected readonly traitEntries = computed<readonly PnjListEntry[]>(() =>
    this.pnj()
      .traits.map((trait) => {
        const traitable = trait.traitable;
        const label = traitable && 'avantage' in traitable ? traitable.avantage : traitable && 'desavantage' in traitable ? traitable.desavantage : '';

        return {label, detail: trait.detail ?? ''};
      })
      .filter((entry) => entry.label),
  );

  protected readonly armorEntries = computed<readonly PnjListEntry[]>(() =>
    (this.pnj().armures as (BolHerosArmureModel | number)[])
      .filter((armure): armure is BolHerosArmureModel => typeof armure === 'object')
      .map((armure) => ({
        label: armure.armure?.armure ?? '',
        detail: [armure.armure?.protection, armure.armure?.malus].filter(Boolean).join(' · '),
      }))
      .filter((entry) => entry.label),
  );

  protected readonly weaponEntries = computed<readonly PnjListEntry[]>(() =>
    (this.pnj().armes as (BolHerosArmeModel | number)[])
      .filter((arme): arme is BolHerosArmeModel => typeof arme === 'object')
      .map((arme) => ({
        label: arme.arme?.arme ?? '',
        detail: [arme.arme?.degats, arme.arme?.portee].filter(Boolean).join(' · '),
      }))
      .filter((entry) => entry.label),
  );
}
