import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {email, form, FormField, required} from '@angular/forms/signals';
import {Router, RouterLink} from '@angular/router';
import {extractApiErrors} from '../../../core/api-error.utils';
import {AuthService} from '../../../core/auth/auth.service';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {DwErrorMessageComponent} from '../../../shared/dw-error-message/dw-error-message';
import {AuthActionsComponent} from '../../auth-card/auth-actions';
import {AuthCardComponent} from '../../auth-card/auth-card';

@Component({
  selector: 'app-forgotten-page',
  imports: [
    FormField,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    DwErrorMessageComponent,
    AuthCardComponent,
    AuthActionsComponent,
  ],
  templateUrl: './forgotten-page.html',
  styleUrl: './forgotten-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgottenPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly pending = signal(false);
  protected readonly messages = signal<string[]>([]);

  protected readonly forgotModel = signal({email: ''});
  protected readonly forgotForm = form(this.forgotModel, (fieldPath) => {
    required(fieldPath.email, {message: 'Adresse mail requise'});
    email(fieldPath.email, {message: 'Adresse mail non valide'});
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.send();
  }

  protected send(): void {
    this.messages.set([]);

    if (this.forgotForm().invalid()) {
      this.forgotForm().markAsTouched();
      this.messages.set(['Une adresse email valide est requise.']);
      return;
    }

    this.pending.set(true);
    this.authService
      .forgottenPassword(this.forgotModel().email)
      .subscribe({
        next: () => {
          this.pending.set(false);
          void this.router.navigateByUrl('/notice/reset');
        },
        error: (error: unknown) => {
          this.pending.set(false);
          this.messages.set(extractApiErrors(error, 'Envoi impossible.'));
        },
      });
  }
}
