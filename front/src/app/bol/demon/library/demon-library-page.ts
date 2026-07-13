import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {BolDemonModel} from '../../models/bol-demon.model';
import {BolDemonStateService} from '../../services/bol-demon-state.service';
import {BolDemonsService} from '../../services/bol-demons.service';
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
import {DemonStatblockComponent} from '../statblock/demon-statblock.component';
import {DemonCardComponent, demonImage} from './demon-card/demon-card.component';

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
  private readonly demons = refreshableResource(() => this.demonsService.demons());

  protected readonly categories = this.demonStateService.categorieList;
  protected readonly searchTerm = signal('');
  protected readonly searchCategorie = signal<number | ''>('');
  protected readonly onlyCreations = signal(false);

  protected readonly filteredDemons = computed(() =>
    [...this.demons.data()]
      .filter((demon) => (this.onlyCreations() ? Boolean(demon.user_id) : true))
      .filter((demon) =>
        this.searchCategorie() !== ''
          ? Number(demon.id_categorie) === Number(this.searchCategorie())
          : true,
      )
      .filter((demon) => matchesTerm(this.searchTerm(), demon.nom, demon.commentaire))
      .sort(ownFirstThenLabel((demon) => Boolean(demon.user_id), (demon) => demon.nom)),
  );
  protected readonly demonCount = computed(() => this.filteredDemons().length);
  protected readonly totalDemonCount = computed(() => this.demons.data().length);

  protected askDelete(demon: BolDemonModel): void {
    confirmDialog(
      this.dialog,
      {
        title: 'Supprimer le démon',
        message: `Voulez-vous supprimer "${demon.nom}" ?`,
        confirmLabel: 'Supprimer',
      },
      {width: '380px'},
    ).subscribe((confirmed) => {
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
    openStatblockDialog(this.dialog, DemonStatblockComponent, {
      demon,
      imageSrc: demonImage(demon),
    });
  }

  private deleteDemon(demon: BolDemonModel): void {
    if (!demon.id) {
      return;
    }

    this.demonsService.deleteDemon(demon.id).subscribe({
      next: () => this.demons.refresh(),
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
