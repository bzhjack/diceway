import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule} from '@angular/material/dialog';
import {BolHerosModel} from '../../models/bol-heros.model';
import {BolHerosService} from '../../services/bol-heros.service';
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
import {DwConfirmDialogComponent} from '../../../shared/dw-confirm-dialog/dw-confirm-dialog';
import {PnjStatblockComponent} from '../statblock/pnj-statblock.component';
import {startWith, switchMap} from 'rxjs';
import {PnjCardComponent, pnjImage, pnjLanguagesText, pnjTypeLabel} from './pnj-card/pnj-card.component';

type PnjType = 'P' | 'C' | 'R';

interface PnjTypeOption {
  readonly label: string;
  readonly value: PnjType | '';
}

@Component({
  selector: 'pnj-statblock-dialog',
  imports: [MatDialogModule, PnjStatblockComponent],
  template: `<bol-pnj-statblock [pnj]="data.pnj" [imageSrc]="data.imageSrc" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PnjStatblockDialogContent {
  protected readonly data = inject<{pnj: BolHerosModel; imageSrc: string}>(MAT_DIALOG_DATA);
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
  private readonly herosService = inject(BolHerosService);
  private readonly dialog = inject(MatDialog);
  private readonly refreshTrigger = signal(0);
  private readonly pnjs = toSignal(
    toObservable(this.refreshTrigger).pipe(
      startWith(0),
      switchMap(() => this.herosService.pnjs()),
    ),
    {initialValue: []},
  );

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
    [...this.pnjs()]
      .filter((pnj) => (this.onlyCreations() ? Boolean(pnj.user_id) : true))
      .filter((pnj) => (this.searchType() ? pnj.type === this.searchType() : true))
      .filter((pnj) => {
        const term = this.searchTerm().trim().toLocaleLowerCase();
        if (!term) {
          return true;
        }

        const searchValues = [
          pnj.origines.nom,
          pnj.origines.commentaire,
          pnj.origines.region?.region,
          pnjTypeLabel(pnj.type),
          pnjLanguagesText(pnj),
        ];

        return searchValues.some((value) => value?.toLocaleLowerCase().includes(term));
      })
      .sort((left, right) => {
        const ownCompare = (left.user_id ? 0 : 1) - (right.user_id ? 0 : 1);
        if (ownCompare !== 0) {
          return ownCompare;
        }

        return (left.origines.nom ?? '').localeCompare(right.origines.nom ?? '');
      }),
  );
  protected readonly pnjCount = computed(() => this.filteredPnjs().length);
  protected readonly totalPnjCount = computed(() => this.pnjs().length);

  protected askDelete(pnj: BolHerosModel): void {
    this.dialog
      .open(DwConfirmDialogComponent, {
        data: {
          title: 'Supprimer le PNJ',
          message: `Voulez-vous supprimer "${pnj.origines.nom ?? 'ce PNJ'}" ?`,
          confirmLabel: 'Supprimer',
        },
        width: '380px',
      })
      .afterClosed()
      .subscribe((confirmed) => {
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
    this.dialog.open(PnjStatblockDialogContent, {
      data: {pnj, imageSrc: pnjImage(pnj)},
      maxWidth: 'min(760px, 92vw)',
      panelClass: 'pnj-statblock-dialog',
    });
  }

  private deletePnj(pnj: BolHerosModel): void {
    if (!pnj.id) {
      return;
    }

    this.herosService.quickDelete(pnj.id).subscribe({
      next: () => this.refreshTrigger.update((value) => value + 1),
    });
  }
}
