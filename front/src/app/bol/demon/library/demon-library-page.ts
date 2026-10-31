import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {form, FormField} from '@angular/forms/signals';
import {RouterLink} from '@angular/router';
import {BolDemonModel} from '../../models/bol-demon.model';
import {BolDemonStateService} from '../../services/bol-demon-state.service';
import {BolDemonsService} from '../../services/bol-demons.service';
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
import {demonStatblockData} from '../../shared/statblock/bol-statblock.builders';
import {DemonCardComponent, demonImage} from './demon-card/demon-card.component';
import {Observable} from 'rxjs';
import {DwLibraryGridComponent} from '../../../shared/dw-library-grid/dw-library-grid';
import {BolLibraryPageBase} from '../../shared/library/library-page.base';
import {LibraryDeleteTexts} from '../../shared/models/library-page.model';

@Component({
  selector: 'bol-demon-library-page',
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
    DemonCardComponent,
  ],
  templateUrl: './demon-library-page.html',
  styleUrl: './demon-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemonLibraryPageComponent extends BolLibraryPageBase<BolDemonModel> {
  private readonly demonStateService = inject(BolDemonStateService);
  private readonly demonsService = inject(BolDemonsService);
  private readonly demons = refreshableResource(() => this.demonsService.demons());
  protected readonly deleteTexts: LibraryDeleteTexts<BolDemonModel> = {
    title: 'Supprimer le démon',
    name: (item) => item.nom,
    error: 'La suppression du démon a échoué.',
  };

  protected readonly categories = this.demonStateService.categorieList;
  protected readonly searchCategorie = signal<number | ''>('');
  protected readonly categorieField = form(this.searchCategorie);
  protected readonly onlyCreations = signal(false);

  protected readonly filteredDemons = computed(() =>
    [...this.demons.data()]
      .filter((demon) => (this.onlyCreations() ? Boolean(demon.user_id) : true))
      .filter((demon) =>
        this.searchCategorie() !== ''
          ? demon.id_categorie === this.searchCategorie()
          : true,
      )
      .filter((demon) => matchesTerm(this.searchTerm(), demon.nom, demon.commentaire))
      .sort(ownFirstThenLabel((demon) => Boolean(demon.user_id), (demon) => demon.nom)),
  );
  protected readonly demonCount = computed(() => this.filteredDemons().length);
  protected readonly totalDemonCount = computed(() => this.demons.data().length);

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.searchCategorie.set('');
    this.onlyCreations.set(false);
  }

  protected openStatblock(demon: BolDemonModel): void {
    openStatblockDialog(this.dialog, BolStatblockComponent, {
      data: demonStatblockData(demon),
      imageSrc: demonImage(demon),
    });
  }

  protected deleteItem(id: NonNullable<BolDemonModel['id']>): Observable<unknown> {
    return this.demonsService.deleteDemon(id);
  }

  protected refreshItems(): void {
    this.demons.refresh();
  }
}
