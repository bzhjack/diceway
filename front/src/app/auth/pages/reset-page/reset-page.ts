import {NgOptimizedImage} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {email, form, FormField, minLength, required, validate} from '@angular/forms/signals';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
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
  selector: 'app-reset-page',
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
  templateUrl: './reset-page.html',
  styleUrl: './reset-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPageComponent {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly token = this.route.snapshot.paramMap.get('token') ?? '';
  private readonly email =
    this.route.snapshot.queryParamMap.get('email') ??
    this.route.snapshot.paramMap.get('email') ??
    '';

  protected readonly pending = signal(false);
  protected readonly messages = signal<string[]>([]);

  protected readonly resetModel = signal({
    token: this.token,
    email: this.email,
    password: '',
    password_confirmation: '',
  });
  protected readonly resetForm = form(this.resetModel, (fieldPath) => {
    required(fieldPath.token);
    required(fieldPath.email);
    email(fieldPath.email);

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
    this.reset();
  }

  protected reset(): void {
    if (this.resetForm().invalid()) {
      this.resetForm().markAsTouched();
      this.messages.set(['Le formulaire contient encore des erreurs.']);
      return;
    }

    this.pending.set(true);
    this.authService
      .resetPassord(this.resetModel())
      .subscribe({
        next: () => {
          this.pending.set(false);
          void this.router.navigateByUrl('/welcome/success');
        },
        error: (error: unknown) => {
          this.pending.set(false);
          this.messages.set(extractApiErrors(error, 'Réinitialisation impossible.'));
        },
      });
  }
}
