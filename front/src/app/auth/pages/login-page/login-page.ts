import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {email, form, FormField, minLength, required} from '@angular/forms/signals';
import {Router, RouterLink} from '@angular/router';
import {finalize} from 'rxjs/operators';
import {extractApiErrors} from '../../../core/api-error.utils';
import {AuthService} from '../../../core/auth/auth.service';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {DwErrorMessageComponent} from '../../../shared/dw-error-message/dw-error-message';
import {
  MatCard,
  MatCardActions,
  MatCardContent,
  MatCardHeader,
  MatCardImage,
  MatCardSubtitle,
  MatCardTitle
} from '@angular/material/card';

@Component({
  selector: 'app-login-page',
  imports: [
    FormField,
    RouterLink,
    NgOptimizedImage,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCard,
    MatCardImage,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    MatCardContent,
    MatCardActions,
    DwErrorMessageComponent,
  ],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly pending = signal(false);
  protected readonly messages = signal<string[]>([]);

  protected readonly loginModel = signal({email: '', password: ''});
  protected readonly loginForm = form(this.loginModel, (fieldPath) => {
    required(fieldPath.email, {message: 'Adresse mail requise'});
    email(fieldPath.email, {message: 'Adresse mail non valide'});
    required(fieldPath.password, {message: 'Mot de passe requis'});
    minLength(fieldPath.password, 8, {message: 'Minimum 8 caractères'});
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.login();
  }

  protected login(): void {
    if (this.pending()) {
      return;
    }

    this.messages.set([]);

    if (this.loginForm().invalid()) {
      this.loginForm().markAsTouched();
      this.messages.set(['Veuillez corriger les erreurs du formulaire.']);
      return;
    }

    this.pending.set(true);
    const credentials = this.loginModel();
    this.authService
      .loginWithCredentials(credentials)
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigateByUrl('/');
        },
        error: (error: unknown) => {
          const status =
            typeof error === 'object' && error !== null && 'status' in error
              ? Number(error.status)
              : 0;

          if (status === 403) {
            void this.router.navigate(['/resend', 'forbidden'], {
              queryParams: { email: credentials.email },
            });
            return;
          }

          if (status === 401) {
            this.messages.set(['Identifiants invalides.']);
            return;
          }

          this.messages.set(extractApiErrors(error, 'Connexion impossible.'));
        },
      });
  }

  protected loginWithGoogle(): void {
    this.messages.set([]);
    this.authService.loginWithGoogle();
  }
}
