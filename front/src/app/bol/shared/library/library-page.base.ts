import {inject, signal} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Observable} from 'rxjs';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {readReturnUrl} from '../../../core/return-url.util';
import {confirmDialog} from '../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {LibraryDeleteTexts} from '../models/library-page.model';

/** Socle d'une bibliothèque de fiches (héros, PNJ, créatures, démons) : recherche, retour à la session d'origine et suppression d'une fiche. */
export abstract class BolLibraryPageBase<TItem extends {id?: string | number | null}> {
  protected readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly searchTerm = signal('');
  /** Revenir à la session de combat d'origine plutôt qu'à la table, si on y accède via ses raccourcis. */
  protected readonly returnUrl = signal(readReturnUrl());

  protected abstract readonly deleteTexts: LibraryDeleteTexts<TItem>;
  protected abstract deleteItem(id: NonNullable<TItem['id']>): Observable<unknown>;
  protected abstract refreshItems(): void;

  protected askDelete(item: TItem): void {
    confirmDialog(
      this.dialog,
      {
        title: this.deleteTexts.title,
        message: `Voulez-vous supprimer "${this.deleteTexts.name(item)}" ?`,
        confirmLabel: 'Supprimer',
      },
      {width: '380px'},
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.remove(item);
      }
    });
  }

  private remove(item: TItem): void {
    if (!item.id) {
      return;
    }

    this.deleteItem(item.id as NonNullable<TItem['id']>).subscribe({
      next: () => this.refreshItems(),
      error: (error: unknown) => {
        this.snackBar.open(extractApiErrorMessage(error, this.deleteTexts.error), 'Fermer', {duration: 5000});
      },
    });
  }
}
