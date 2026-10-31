import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {form, FormField, maxLength, min, required} from '@angular/forms/signals';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BolArmureCategorie, BolArmureModel} from '../../models/bol-armure.model';
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

interface ArmorDraft {
  armure: string;
  protection: string;
  malus: string;
  pts_de_pouvoir: string;
  categorie: BolArmureCategorie;
  malus_agilite: number;
  malus_initiative: number;
  malus_attaque_subie: number;
  malus_attaque_subie_portee: 'une' | 'toutes' | null;
}

@Component({
  selector: 'bol-armure-library-page',
  imports: [
    FormField,
    RouterLink,
    MatButtonModule,
    MatCard,
    MatCardContent,
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
  templateUrl: './armure-library-page.html',
  styleUrls: ['../../shared/equipment-library/equipment-library.scss', './armure-library-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArmureLibraryPageComponent extends BolEquipmentLibraryPageBase<BolArmureModel, ArmorDraft> {
  private readonly catalogService = inject(BolCatalogService);
  protected readonly items = refreshableResource(() => this.catalogService.armures());

  protected readonly texts: EquipmentLibraryTexts<BolArmureModel> = {
    newTitle: 'Nouvelle armure',
    editTitle: 'Modifier l’armure',
    deleteTitle: 'Supprimer l’armure',
    name: (armor) => armor.armure,
    saveError: 'Impossible d’enregistrer cette armure.',
    deleteError: 'Impossible de supprimer cette armure.',
  };

  protected readonly model = signal<ArmorDraft>(this.emptyDraft());
  protected readonly itemForm = form(this.model, (path) => {
    required(path.armure);
    maxLength(path.armure, 255);
    required(path.protection);
    maxLength(path.protection, 255);
    maxLength(path.malus, 255);
    maxLength(path.pts_de_pouvoir, 50);
    required(path.categorie);
    required(path.malus_agilite);
    min(path.malus_agilite, 0);
    required(path.malus_initiative);
    min(path.malus_initiative, 0);
    required(path.malus_attaque_subie);
    min(path.malus_attaque_subie, 0);
  });

  protected readonly filteredArmors = computed(() =>
    [...this.items.data()]
      .filter((armor) => (this.onlyCreations() ? Boolean(armor.user_id) : true))
      .filter((armor) =>
        matchesTerm(this.searchTerm(), armor.armure, armor.protection, armor.malus, armor.pts_de_pouvoir),
      )
      .sort((left, right) => left.armure.localeCompare(right.armure)),
  );
  protected readonly armorCount = computed(() => this.filteredArmors().length);
  protected readonly shieldCount = computed(
    () => this.items.data().filter((armor) => armor.categorie === 'bouclier').length,
  );

  protected readonly categorieLabel = (categorie: BolArmureCategorie): string =>
    ({armure: 'Armure', bouclier: 'Bouclier', casque: 'Casque'})[categorie];

  protected emptyDraft(): ArmorDraft {
    return {
      armure: '',
      protection: '',
      malus: '',
      pts_de_pouvoir: '',
      categorie: 'armure',
      malus_agilite: 0,
      malus_initiative: 0,
      malus_attaque_subie: 0,
      malus_attaque_subie_portee: null,
    };
  }

  protected draftOf(armor: BolArmureModel): ArmorDraft {
    return {
      armure: armor.armure,
      protection: armor.protection ?? '',
      malus: armor.malus ?? '',
      pts_de_pouvoir: armor.pts_de_pouvoir ?? '',
      categorie: armor.categorie,
      malus_agilite: armor.malus_agilite,
      malus_initiative: armor.malus_initiative,
      malus_attaque_subie: armor.malus_attaque_subie,
      malus_attaque_subie_portee: armor.malus_attaque_subie_portee,
    };
  }

  protected payloadOf(draft: ArmorDraft, id: number | null): BolArmureModel {
    return {
      id,
      armure: draft.armure.trim(),
      protection: draft.protection.trim(),
      malus: this.nullableTrimmed(draft.malus),
      pts_de_pouvoir: this.nullableTrimmed(draft.pts_de_pouvoir),
      categorie: draft.categorie,
      malus_agilite: draft.malus_agilite,
      malus_initiative: draft.malus_initiative,
      malus_attaque_subie: draft.malus_attaque_subie,
      malus_attaque_subie_portee: draft.malus_attaque_subie_portee,
    };
  }

  protected createItem(payload: BolArmureModel) {
    return this.catalogService.createArmure(payload);
  }

  protected updateItem(payload: BolArmureModel) {
    return this.catalogService.updateArmure(payload);
  }

  protected deleteItem(id: number) {
    return this.catalogService.deleteArmure(id);
  }
}
