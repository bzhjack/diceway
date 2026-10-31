import {NgOptimizedImage} from '@angular/common';
import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {
  MatCard,
  MatCardActions,
  MatCardContent,
  MatCardHeader,
  MatCardImage,
  MatCardSubtitle,
  MatCardTitle,
} from '@angular/material/card';

/** La carte d'une page d'authentification : l'illustration, le titre, le formulaire (contenu projeté) et le pied (`authFooter`). */
@Component({
  selector: 'app-auth-card',
  imports: [NgOptimizedImage, MatCard, MatCardImage, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent, MatCardActions],
  template: `
    <section class="auth-mat-page">
      <mat-card class="auth-mat-card" appearance="outlined">
        <img mat-card-image ngSrc="assets/dw1.jpg" alt="" width="400" height="265" priority />

        <mat-card-header>
          <mat-card-title [class.auth-card-title--danger]="titleDanger()">{{ title() }}</mat-card-title>
          <mat-card-subtitle>{{ subtitle() }}</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <ng-content />
        </mat-card-content>

        <mat-card-actions>
          <span class="auth-mat-footer">
            <ng-content select="[authFooter]" />
          </span>
        </mat-card-actions>
      </mat-card>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .auth-card-title--danger {
      color: var(--mat-sys-error);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthCardComponent {
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly titleDanger = input(false);
}
