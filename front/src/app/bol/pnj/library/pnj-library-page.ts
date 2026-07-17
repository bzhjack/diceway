import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {BolHerosModel} from '../../models/bol-heros.model';
import {BolPnjService} from '../../services/bol-pnj.service';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {confirmDialog} from '../../../shared/dw-confirm-dialog/confirm-dialog.utils';
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

type PnjType = 'P' | 'C' | 'R';

interface PnjTypeOption {
  readonly label: string;
  readonly value: PnjType | '';
}

@Component({
  selector: 'bol-pnj-library-page',
  imports: [
    FormsModule,
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
    PnjCardComponent,
  ],
  templateUrl: './pnj-library-page.html',
  styleUrl: './pnj-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PnjLibraryPageComponent {
  private readonly pnjService = inject(BolPnjService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly pnjs = refreshableResource(() => this.pnjService.pnjs());

  protected readonly typeOptions: PnjTypeOption[] = [
    {label: 'Tous les profils', value: ''},
    {label: 'Coriaces', value: 'C'},
    {label: 'Rivaux', value: 'R'},
    {label: 'Pietaille', value: 'P'},
  ];
  protected readonly searchTerm = signal('');
  protected readonly searchType = signal<PnjType | ''>('');
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

  protected askDelete(pnj: BolHerosModel): void {
    confirmDialog(
      this.dialog,
      {
        title: 'Supprimer le PNJ',
        message: `Voulez-vous supprimer "${pnj.origines.nom ?? 'ce PNJ'}" ?`,
        confirmLabel: 'Supprimer',
      },
      {width: '380px'},
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.deletePnj(pnj);
      }
    });
  }

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

  private deletePnj(pnj: BolHerosModel): void {
    if (!pnj.id) {
      return;
    }

    this.pnjService.deletePnj(pnj.id).subscribe({
      next: () => this.pnjs.refresh(),
      error: (error: unknown) => {
        this.snackBar.open(
          extractApiErrorMessage(error, 'La suppression du PNJ a échoué.'),
          'Fermer',
          {duration: 5000},
        );
      },
    });
  }
}
