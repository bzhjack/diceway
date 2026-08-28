import {NgOptimizedImage} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {email, form, FormField, minLength, required, validate} from '@angular/forms/signals';
import {Router, RouterLink} from '@angular/router';
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
  MatCardTitle,
} from '@angular/material/card';

@Component({
  selector: 'app-register-page',
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
  templateUrl: './register-page.html',
  styleUrl: './register-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly pending = signal(false);
  protected readonly messages = signal<string[]>([]);

  protected readonly registerModel = signal({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  protected readonly registerForm = form(this.registerModel, (fieldPath) => {
    required(fieldPath.name, {message: 'Pseudonyme requis'});
    minLength(fieldPath.name, 5, {message: 'Minimum 5 caractères'});

    required(fieldPath.email, {message: 'Adresse mail requise'});
    email(fieldPath.email, {message: 'Adresse mail non valide'});

    required(fieldPath.password, {message: 'Mot de passe requis'});
    minLength(fieldPath.password, 8, {message: 'Minimum 8 caractères'});

    required(fieldPath.password_confirmation, {message: 'Confirmation requise'});
    validate(fieldPath.password_confirmation, ({value, valueOf}) => {
      if (value() !== valueOf(fieldPath.password)) {
        return {kind: 'passwordMismatch', message: 'Les mots de passe ne correspondent pas'};
      }
      return null;
    });
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.register();
  }

  protected register(): void {
    if (this.registerForm().invalid()) {
      this.registerForm().markAsTouched();
      return;
    }

    this.messages.set([]);
    this.pending.set(true);
    this.authService
      .register(this.registerModel())
      .subscribe({
        next: () => {
          this.pending.set(false);
          void this.router.navigateByUrl('/notice');
        },
        error: (error: unknown) => {
          this.pending.set(false);
          this.messages.set(extractApiErrors(error, 'Inscription impossible.'));
        },
      });
  }
}
