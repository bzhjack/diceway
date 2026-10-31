import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {form, FormField, maxLength, required} from '@angular/forms/signals';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatCard} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BolArmeModel} from '../../models/bol-arme.model';
import {BolCatalogService} from '../../services/bol-catalog.service';
import {matchesTerm} from '../../../shared/list.utils';
import {refreshableResource} from '../../../shared/refreshable-resource';
import {DwTagComponent} from '../../../shared/dw-tag/dw-tag';
import {DwBadgeComponent} from '../../../shared/dw-badge/dw-badge';
import {DwLibraryHeaderComponent} from '../../../shared/dw-library-header/dw-library-header';
import {DwLibraryToolbarComponent} from '../../../shared/dw-library-toolbar/dw-library-toolbar';
import {EquipmentFormPanelComponent} from '../../shared/equipment-library/equipment-form-panel.component';
import {BolEquipmentLibraryPageBase} from '../../shared/equipment-library/equipment-library-page.base';
import {EquipmentLibraryTexts} from '../../shared/models/equipment-library.model';

interface WeaponTypeOption {
  readonly label: string;
  readonly value: 'M' | 'T';
}

interface WeaponDraft {
  arme: string;
  type: 'M' | 'T';
  degats: string;
  portee: string;
  notes: string;
}

@Component({
  selector: 'bol-arme-library-page',
  imports: [
    FormField,
    RouterLink,
    MatButtonModule,
    MatCard,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    DwTagComponent,
    DwBadgeComponent,
    DwLibraryHeaderComponent,
    DwLibraryToolbarComponent,
    EquipmentFormPanelComponent,
  ],
  templateUrl: './arme-library-page.html',
  styleUrls: ['../../shared/equipment-library/equipment-library.scss', './arme-library-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArmeLibraryPageComponent extends BolEquipmentLibraryPageBase<BolArmeModel, WeaponDraft> {
  private readonly catalogService = inject(BolCatalogService);
  protected readonly items = refreshableResource(() => this.catalogService.armes());

  protected readonly texts: EquipmentLibraryTexts<BolArmeModel> = {
    newTitle: 'Nouvelle arme',
    editTitle: 'Modifier l’arme',
    deleteTitle: 'Supprimer l’arme',
    name: (weapon) => weapon.arme,
    saveError: 'Impossible d’enregistrer cette arme.',
    deleteError: 'Impossible de supprimer cette arme.',
  };

  protected readonly weaponTypeOptions: WeaponTypeOption[] = [
    {label: 'Mêlée', value: 'M'},
    {label: 'Tir', value: 'T'},
  ];

  protected readonly model = signal<WeaponDraft>(this.emptyDraft());
  protected readonly itemForm = form(this.model, (path) => {
    required(path.arme);
    maxLength(path.arme, 255);
    required(path.type);
    required(path.degats);
    maxLength(path.degats, 50);
    maxLength(path.portee, 50);
    maxLength(path.notes, 65535);
  });

  protected readonly filteredWeapons = computed(() =>
    [...this.items.data()]
      .filter((weapon) => (this.onlyCreations() ? Boolean(weapon.user_id) : true))
      .filter((weapon) =>
        matchesTerm(
          this.searchTerm(),
          weapon.arme,
          this.weaponTypeLabel(weapon.type),
          weapon.degats,
          weapon.portee,
          weapon.notes,
        ),
      )
      .sort((left, right) => {
        if (left.type !== right.type) {
          return left.type.localeCompare(right.type);
        }

        return left.arme.localeCompare(right.arme);
      }),
  );
  protected readonly weaponCount = computed(() => this.filteredWeapons().length);
  protected readonly meleeCount = computed(() => this.items.data().filter((weapon) => weapon.type === 'M').length);
  protected readonly rangedCount = computed(() => this.items.data().filter((weapon) => weapon.type === 'T').length);

  protected weaponTypeLabel(type: BolArmeModel['type']): string {
    return type === 'M' ? 'Mêlée' : 'Tir';
  }

  protected emptyDraft(): WeaponDraft {
    return {arme: '', type: 'M', degats: '', portee: '', notes: ''};
  }

  protected draftOf(weapon: BolArmeModel): WeaponDraft {
    return {
      arme: weapon.arme,
      type: weapon.type,
      degats: weapon.degats ?? '',
      portee: weapon.portee ?? '',
      notes: weapon.notes ?? '',
    };
  }

  protected payloadOf(draft: WeaponDraft, id: number | null): BolArmeModel {
    return {
      id,
      arme: draft.arme.trim(),
      type: draft.type,
      degats: draft.degats.trim(),
      portee: this.nullableTrimmed(draft.portee),
      notes: this.nullableTrimmed(draft.notes),
    };
  }

  protected createItem(payload: BolArmeModel) {
    return this.catalogService.createArme(payload);
  }

  protected updateItem(payload: BolArmeModel) {
    return this.catalogService.updateArme(payload);
  }

  protected deleteItem(id: number) {
    return this.catalogService.deleteArme(id);
  }
}
