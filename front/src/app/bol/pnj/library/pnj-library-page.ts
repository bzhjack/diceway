import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {form, FormField} from '@angular/forms/signals';
import {RouterLink} from '@angular/router';
import {BolHerosModel} from '../../models/bol-heros.model';
import {BolPnjService} from '../../services/bol-pnj.service';
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
import {pnjStatblockData} from '../../shared/statblock/bol-statblock.builders';
import {PnjCardComponent, pnjImage, pnjLanguagesText, pnjTypeLabel} from './pnj-card/pnj-card.component';
import {Observable} from 'rxjs';
import {DwLibraryGridComponent} from '../../../shared/dw-library-grid/dw-library-grid';
import {BolLibraryPageBase} from '../../shared/library/library-page.base';
import {LibraryDeleteTexts} from '../../shared/models/library-page.model';

type PnjType = 'P' | 'C' | 'R';

interface PnjTypeOption {
  readonly label: string;
  readonly value: PnjType | '';
}

@Component({
  selector: 'bol-pnj-library-page',
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
    PnjCardComponent,
  ],
  templateUrl: './pnj-library-page.html',
  styleUrl: './pnj-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PnjLibraryPageComponent extends BolLibraryPageBase<BolHerosModel> {
  private readonly pnjService = inject(BolPnjService);
  private readonly pnjs = refreshableResource(() => this.pnjService.pnjs());
  protected readonly deleteTexts: LibraryDeleteTexts<BolHerosModel> = {
    title: 'Supprimer le PNJ',
    name: (item) => item.origines.nom ?? 'ce PNJ',
    error: 'La suppression du PNJ a échoué.',
  };

  protected readonly typeOptions: PnjTypeOption[] = [
    {label: 'Tous les profils', value: ''},
    {label: 'Coriaces', value: 'C'},
    {label: 'Rivaux', value: 'R'},
    {label: 'Pietaille', value: 'P'},
  ];
  protected readonly searchType = signal<PnjType | ''>('');
  protected readonly typeField = form(this.searchType);
  protected readonly onlyCreations = signal(false);

  protected readonly filteredPnjs = computed(() =>
    [...this.pnjs.data()]
      .filter((pnj) => (this.onlyCreations() ? Boolean(pnj.user_id) : true))
      .filter((pnj) => (this.searchType() ? pnj.type === this.searchType() : true))
      .filter((pnj) =>
        matchesTerm(
          this.searchTerm(),
          pnj.origines.nom,
          pnj.origines.commentaire,
          pnj.origines.region?.region,
          pnjTypeLabel(pnj.type),
          pnjLanguagesText(pnj),
        ),
      )
      .sort(ownFirstThenLabel((pnj) => Boolean(pnj.user_id), (pnj) => pnj.origines.nom ?? '')),
  );
  protected readonly pnjCount = computed(() => this.filteredPnjs().length);
  protected readonly totalPnjCount = computed(() => this.pnjs.data().length);

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.searchType.set('');
    this.onlyCreations.set(false);
  }

  protected openStatblock(pnj: BolHerosModel): void {
    openStatblockDialog(this.dialog, BolStatblockComponent, {
      data: pnjStatblockData(pnj),
      imageSrc: pnjImage(pnj),
    });
  }

  protected deleteItem(id: NonNullable<BolHerosModel['id']>): Observable<unknown> {
    return this.pnjService.deletePnj(id);
  }

  protected refreshItems(): void {
    this.pnjs.refresh();
  }
}
