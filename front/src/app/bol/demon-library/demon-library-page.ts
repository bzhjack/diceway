import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {BolDemonModel} from '../models/bol-demon.model';
import {BolDemonStateService} from '../services/bol-demon-state.service';
import {BolDemonsService} from '../services/bol-demons.service';
import {DwConfirmDialogComponent} from '../../shared/dw-confirm-dialog/dw-confirm-dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatCard} from '@angular/material/card';
import {DwTagComponent} from '../../shared/dw-tag/dw-tag';
import {DwLibraryHeaderComponent} from '../../shared/dw-library-header/dw-library-header';
import {DwLibraryToolbarComponent} from '../../shared/dw-library-toolbar/dw-library-toolbar';
import {startWith, switchMap} from 'rxjs';

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
    MatTooltipModule,
    MatCard,
    DwTagComponent,
    DwLibraryHeaderComponent,
    DwLibraryToolbarComponent,
  ],
  templateUrl: './demon-library-page.html',
  styleUrl: './demon-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemonLibraryPageComponent {
  private readonly demonStateService = inject(BolDemonStateService);
  private readonly demonsService = inject(BolDemonsService);
  private readonly dialog = inject(MatDialog);
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
        const categoryCompare = Number(left.id_categorie) - Number(right.id_categorie);
        if (categoryCompare !== 0) {
          return categoryCompare;
        }

        return left.nom.localeCompare(right.nom);
      }),
  );
  protected readonly demonCount = computed(() => this.filteredDemons().length);
  protected readonly totalDemonCount = computed(() => this.demons().length);

  protected showGroupHeader(index: number): boolean {
    const demons = this.filteredDemons();
    return index === 0 || demons[index - 1].id_categorie !== demons[index].id_categorie;
  }

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

  protected demonImage(demon: BolDemonModel): string {
    if (!demon.user_id) {
      return `/assets/bol/demon/${demon.id}.jpg`;
    }

    return demon.avatar || '/assets/bol/empty-avatar.jpg';
  }

  private deleteDemon(demon: BolDemonModel): void {
    if (!demon.id) {
      return;
    }

    this.demonsService.deleteDemon(demon.id).subscribe({
      next: () => this.refreshTrigger.update((value) => value + 1),
    });
  }
}
