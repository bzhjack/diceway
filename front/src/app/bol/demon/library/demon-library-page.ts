import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {BolDemonModel} from '../../models/bol-demon.model';
import {BolDemonStateService} from '../../services/bol-demon-state.service';
import {BolDemonsService} from '../../services/bol-demons.service';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {DwConfirmDialogComponent} from '../../../shared/dw-confirm-dialog/dw-confirm-dialog';
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
import {DemonStatblockComponent} from '../statblock/demon-statblock.component';
import {startWith, switchMap} from 'rxjs';
import {DemonCardComponent, demonImage} from './demon-card/demon-card.component';

@Component({
  selector: 'demon-statblock-dialog',
  imports: [MatDialogModule, DemonStatblockComponent],
  template: `<bol-demon-statblock [demon]="data.demon" [imageSrc]="data.imageSrc" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemonStatblockDialogContent {
  protected readonly data = inject<{demon: BolDemonModel; imageSrc: string}>(MAT_DIALOG_DATA);
}

@Component({
  selector: 'bol-demon-library-page',
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
    DemonCardComponent,
  ],
  templateUrl: './demon-library-page.html',
  styleUrl: './demon-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemonLibraryPageComponent {
  private readonly demonStateService = inject(BolDemonStateService);
  private readonly demonsService = inject(BolDemonsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly refreshTrigger = signal(0);
  private readonly demons = toSignal(
    toObservable(this.refreshTrigger).pipe(
      startWith(0),
      switchMap(() => this.demonsService.demons()),
    ),
    {initialValue: []},
  );

  protected readonly categories = this.demonStateService.categorieList;
  protected readonly searchTerm = signal('');
  protected readonly searchCategorie = signal<number | ''>('');
  protected readonly onlyCreations = signal(false);

  protected readonly filteredDemons = computed(() =>
    [...this.demons()]
      .filter((demon) => (this.onlyCreations() ? Boolean(demon.user_id) : true))
      .filter((demon) =>
        this.searchCategorie() !== ''
          ? Number(demon.id_categorie) === Number(this.searchCategorie())
          : true,
      )
      .filter((demon) => {
        const term = this.searchTerm().trim().toLocaleLowerCase();
        if (!term) {
          return true;
        }

        return (
          demon.nom.toLocaleLowerCase().includes(term) ||
          (demon.commentaire ?? '').toLocaleLowerCase().includes(term)
        );
      })
      .sort((left, right) => {
        const ownCompare = (left.user_id ? 0 : 1) - (right.user_id ? 0 : 1);
        if (ownCompare !== 0) {
          return ownCompare;
        }

        return left.nom.localeCompare(right.nom);
      }),
  );
  protected readonly demonCount = computed(() => this.filteredDemons().length);
  protected readonly totalDemonCount = computed(() => this.demons().length);

  protected askDelete(demon: BolDemonModel): void {
    this.dialog
      .open(DwConfirmDialogComponent, {
        data: {
          title: 'Supprimer le démon',
          message: `Voulez-vous supprimer "${demon.nom}" ?`,
          confirmLabel: 'Supprimer',
        },
        width: '380px',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.deleteDemon(demon);
        }
      });
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.searchCategorie.set('');
    this.onlyCreations.set(false);
  }

  protected openStatblock(demon: BolDemonModel): void {
    this.dialog.open(DemonStatblockDialogContent, {
      data: {demon, imageSrc: demonImage(demon)},
      maxWidth: 'min(760px, 92vw)',
      panelClass: 'demon-statblock-dialog',
    });
  }

  private deleteDemon(demon: BolDemonModel): void {
    if (!demon.id) {
      return;
    }

    this.demonsService.deleteDemon(demon.id).subscribe({
      next: () => this.refreshTrigger.update((value) => value + 1),
      error: (error: unknown) => {
        this.snackBar.open(
          extractApiErrorMessage(error, 'La suppression du démon a échoué.'),
          'Fermer',
          {duration: 5000},
        );
      },
    });
  }
}
