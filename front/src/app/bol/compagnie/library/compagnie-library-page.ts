import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatCard} from '@angular/material/card';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatTooltip} from '@angular/material/tooltip';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {confirmDialog} from '../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {DwLibraryHeaderComponent} from '../../../shared/dw-library-header/dw-library-header';
import {DwLibraryToolbarComponent} from '../../../shared/dw-library-toolbar/dw-library-toolbar';
import {DwTagComponent} from '../../../shared/dw-tag/dw-tag';
import {matchesTerm} from '../../../shared/list.utils';
import {refreshableResource} from '../../../shared/refreshable-resource';
import {BolCompagnieModel} from '../../models/bol-compagnie.model';
import {BolCompagnieService} from '../../services/bol-compagnie.service';
import {CompagnieDialogData} from '../../session/models/compagnie-dialog.model';
import {CompagnieDialogComponent} from '../../session/new/compagnie-dialog/compagnie-dialog';

/** « Compagnies » : celles du compte, leurs héros et leurs parties, à créer, modifier ou supprimer. Partage la feuille de style de « Mes parties ». */
@Component({
  selector: 'bol-compagnie-library-page',
  imports: [RouterLink, MatButtonModule, MatCard, MatIconModule, MatTooltip, DwLibraryHeaderComponent, DwLibraryToolbarComponent, DwTagComponent],
  templateUrl: './compagnie-library-page.html',
  styleUrl: '../../session/library/session-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompagnieLibraryPageComponent {
  private readonly compagnieService = inject(BolCompagnieService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly compagnies = refreshableResource(() => this.compagnieService.compagnies());

  protected readonly searchTerm = signal('');

  protected readonly lignes = computed(() =>
    this.compagnies
      .data()
      .filter((compagnie) => matchesTerm(this.searchTerm(), compagnie.nom))
      .map((compagnie) => ({
        compagnie,
        heros: compagnie.heros.map((heros) => heros.nom).join(', ') || 'Aucun héros',
        parties: compagnie.parties === 0 ? 'aucune partie' : compagnie.parties === 1 ? '1 partie' : `${compagnie.parties} parties`,
      })),
  );
  protected readonly totalCount = computed(() => this.compagnies.data().length);
  protected readonly visibleCount = computed(() => this.lignes().length);

  /** Crée une compagnie (`null`) ou modifie celle-ci ; la liste se relit si quelque chose a été enregistré. */
  protected ouvrir(compagnie: BolCompagnieModel | null): void {
    this.dialog
      .open<CompagnieDialogComponent, CompagnieDialogData, BolCompagnieModel>(CompagnieDialogComponent, {
        data: {compagnie},
        width: 'min(720px, 94vw)',
        maxWidth: '94vw',
        ariaLabelledBy: 'otd-titre',
        autoFocus: '.otd-nom input',
      })
      .afterClosed()
      .subscribe((enregistree) => {
        if (enregistree) {
          this.compagnies.refresh();
        }
      });
  }

  protected supprimer(compagnie: BolCompagnieModel): void {
    confirmDialog(
      this.dialog,
      {title: 'Supprimer la compagnie', message: `Supprimer « ${compagnie.nom} » ? Ses héros restent dans la bibliothèque.`, confirmLabel: 'Supprimer'},
      {width: '420px'},
    ).subscribe((confirme) => {
      if (!confirme) {
        return;
      }
      this.compagnieService.supprimer(compagnie.id).subscribe({
        next: () => this.compagnies.refresh(),
        error: (error: unknown) => this.snackBar.open(extractApiErrorMessage(error, 'Impossible de supprimer la compagnie.'), 'Fermer', {duration: 5000}),
      });
    });
  }
}
