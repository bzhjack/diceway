import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {take} from 'rxjs';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {CombatSelectionService} from '../../services/combat-selection.service';
import {CombatantPickerDialogComponent} from './combatant-picker-dialog/combatant-picker-dialog';

/** Écran de création d'une session : choix des héros présents à table, sans adversaire ni initiative (mode libre). */
@Component({
  selector: 'bol-session-new-page',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './session-new-page.html',
  styleUrl: './session-new-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionNewPageComponent {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  protected readonly selection = inject(CombatSelectionService);

  protected readonly launching = signal(false);
  protected readonly canLaunch = computed(() => this.selection.combatants().length > 0);

  constructor() {
    this.selection.loadCatalog();
  }

  protected openPicker(): void {
    this.dialog.open(CombatantPickerDialogComponent, {
      width: 'min(1024px, 94vw)',
      maxWidth: '94vw',
      position: {top: '5vh'},
      data: {lockKind: 'hero'},
    });
  }

  protected launchSession(): void {
    this.launching.set(true);
    this.selection
      .launch()
      .pipe(take(1))
      .subscribe({
        next: (session) => {
          this.launching.set(false);
          this.selection.reset();

          if (session.id) {
            void this.router.navigate(['/session', session.id, 'play']);
          }
        },
        error: (error: unknown) => {
          this.launching.set(false);
          this.snackBar.open(extractApiErrorMessage(error, 'Impossible de créer la session.'), 'OK', {
            duration: 6000,
          });
        },
      });
  }
}
