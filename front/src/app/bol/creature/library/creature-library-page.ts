import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {form, FormField} from '@angular/forms/signals';
import {RouterLink} from '@angular/router';
import {BolCreatureModel} from '../../models/bol-creature.model';
import {BolCreatureStateService} from '../../services/bol-creature-state.service';
import {BolCreaturesService} from '../../services/bol-creatures.service';
import {openStatblockDialog} from '../../../shared/dw-statblock-dialog/dw-statblock-dialog';
import {matchesTerm, ownFirstThenLabel} from '../../../shared/list.utils';
import {refreshableResource} from '../../../shared/refreshable-resource';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatCard} from '@angular/material/card';
import {DwTagComponent} from '../../../shared/dw-tag/dw-tag';
import {DwLibraryHeaderComponent} from '../../../shared/dw-library-header/dw-library-header';
import {DwLibraryToolbarComponent} from '../../../shared/dw-library-toolbar/dw-library-toolbar';
import {BolStatblockComponent} from '../../shared/statblock/bol-statblock.component';
import {creatureStatblockData} from '../../shared/statblock/bol-statblock.builders';
import {CreatureCardComponent, creatureImage} from './creature-card/creature-card.component';
import {Observable} from 'rxjs';
import {DwLibraryGridComponent} from '../../../shared/dw-library-grid/dw-library-grid';
import {BolLibraryPageBase} from '../../shared/library/library-page.base';
import {LibraryDeleteTexts} from '../../shared/models/library-page.model';

@Component({
  selector: 'bol-creature-library-page',
  imports: [
    FormField,
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatCard,
    DwTagComponent,
    DwLibraryHeaderComponent,
    DwLibraryToolbarComponent,
    DwLibraryGridComponent,
    CreatureCardComponent,
  ],
  templateUrl: './creature-library-page.html',
  styleUrl: './creature-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatureLibraryPageComponent extends BolLibraryPageBase<BolCreatureModel> {
  private readonly creatureStateService = inject(BolCreatureStateService);
  private readonly creaturesService = inject(BolCreaturesService);
  private readonly creatures = refreshableResource(() => this.creaturesService.creatures());
  protected readonly deleteTexts: LibraryDeleteTexts<BolCreatureModel> = {
    title: 'Supprimer la créature',
    name: (item) => item.nom,
    error: 'La suppression de la créature a échoué.',
  };

  protected readonly tailles = this.creatureStateService.tailleList;
  protected readonly searchTaille = signal<number | ''>('');
  protected readonly tailleField = form(this.searchTaille);
  protected readonly onlyCreations = signal(false);

  protected readonly filteredCreatures = computed(() =>
    [...this.creatures.data()]
      .filter((creature) => (this.onlyCreations() ? Boolean(creature.user_id) : true))
      .filter((creature) =>
        this.searchTaille() !== ''
          ? creature.id_taille === this.searchTaille()
          : true,
      )
      .filter((creature) => matchesTerm(this.searchTerm(), creature.nom, creature.commentaire))
      .sort(ownFirstThenLabel((creature) => Boolean(creature.user_id), (creature) => creature.nom)),
  );
  protected readonly creatureCount = computed(() => this.filteredCreatures().length);
  protected readonly totalCreatureCount = computed(() => this.creatures.data().length);

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.searchTaille.set('');
    this.onlyCreations.set(false);
  }

  protected openStatblock(creature: BolCreatureModel): void {
    openStatblockDialog(this.dialog, BolStatblockComponent, {
      data: creatureStatblockData(creature),
      imageSrc: creatureImage(creature),
    });
  }

  protected deleteItem(id: NonNullable<BolCreatureModel['id']>): Observable<unknown> {
    return this.creaturesService.deleteCreature(id);
  }

  protected refreshItems(): void {
    this.creatures.refresh();
  }
}
