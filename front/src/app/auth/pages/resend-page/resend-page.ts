import {NgOptimizedImage} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {email, form, FormField, required} from '@angular/forms/signals';
import {ActivatedRoute, RouterLink} from '@angular/router';
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
  selector: 'app-resend-page',
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
  templateUrl: './resend-page.html',
  styleUrl: './resend-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResendPageComponent {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly state = this.route.snapshot.paramMap.get('state');
  private readonly presetEmail = this.route.snapshot.queryParamMap.get('email') ?? '';

  protected readonly pending = signal(false);
  protected readonly successMessage = signal('');
  protected readonly messages = signal<string[]>([]);
  protected readonly forbidden = this.state === 'forbidden';
  protected readonly title = this.forbidden ? 'Adresse mail non vérifiée' : "Renvoyer l'email de confirmation";

  protected readonly resendModel = signal({email: this.presetEmail});
  protected readonly resendForm = form(this.resendModel, (fieldPath) => {
    required(fieldPath.email, {message: 'Adresse mail requise'});
    email(fieldPath.email, {message: 'Adresse mail non valide'});
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.send();
  }

  protected send(): void {
    this.messages.set([]);
    this.successMessage.set('');

    if (this.resendForm().invalid()) {
      this.resendForm().markAsTouched();
      this.messages.set(['Une adresse email valide est requise.']);
      return;
    }

    this.pending.set(true);
    this.authService
      .sendMail(this.resendModel().email)
      .subscribe({
        next: (response) => {
          this.pending.set(false);
          this.successMessage.set(response.message);
        },
        error: (error: unknown) => {
          this.pending.set(false);
          this.messages.set(extractApiErrors(error, 'Envoi impossible.'));
        },
      });
  }
}
