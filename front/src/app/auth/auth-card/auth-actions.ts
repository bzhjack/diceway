import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {RouterLink} from '@angular/router';

/** Les boutons d'un formulaire d'authentification : le retour à la connexion, et l'envoi, avec son attente. */
@Component({
  selector: 'app-auth-actions',
  imports: [RouterLink, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="auth-mat-actions auth-mat-actions--end">
      <button mat-stroked-button type="button" routerLink="/login" [disabled]="pending()">Retour</button>
      <button mat-flat-button type="submit" [disabled]="pending() || invalid()">
        @if (pending()) {
          <mat-progress-spinner mode="indeterminate" diameter="18" />
        } @else {
          {{ submitLabel() }}
        }
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthActionsComponent {
  readonly pending = input.required<boolean>();
  readonly invalid = input(false);
  readonly submitLabel = input.required<string>();
}
