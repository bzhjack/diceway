import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {HeroStatblockDialogComponent, HeroStatblockDialogData} from '../hero-statblock-dialog/hero-statblock-dialog';

/**
 * Enveloppe `MatDialog` de `bol-hero-statblock-dialog` (contenu embarquable, prend ses données en
 * `input()` — cf. son propre commentaire) : seul contexte qui l'ouvre encore en dialog plutôt que
 * dans le panneau fusionné `bol-hero-action-panel` — un héros en mode combat, où le double-clic
 * garde son rôle de ciblage d'attaque plutôt que d'ouvrir le jet d'action.
 */
@Component({
  selector: 'bol-hero-statblock-popup',
  imports: [MatIconModule, HeroStatblockDialogComponent],
  templateUrl: './hero-statblock-popup.html',
  styleUrl: './hero-statblock-popup.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroStatblockPopupComponent {
  protected readonly data = inject<HeroStatblockDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<HeroStatblockPopupComponent, boolean>);

  private readonly changed = signal(false);

  constructor() {
    this.ref.disableClose = true;
    this.ref.backdropClick().subscribe(() => this.close());
    this.ref.keydownEvents().subscribe((event) => {
      if (event.key === 'Escape') {
        this.close();
      }
    });
  }

  protected onChanged(): void {
    this.changed.set(true);
  }

  protected close(): void {
    this.ref.close(this.changed());
  }
}
