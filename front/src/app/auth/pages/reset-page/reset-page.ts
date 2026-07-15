import {NgOptimizedImage} from '@angular/common';
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {extractApiErrors} from '../../../core/api-error.utils';
import {passwordMatchValidator} from '../../../core/auth/auth-form.utils';
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
    ReactiveFormsModule,
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
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly token = this.route.snapshot.paramMap.get('token') ?? '';
  private readonly email =
    this.route.snapshot.queryParamMap.get('email') ??
    this.route.snapshot.paramMap.get('email') ??
    '';

  protected pending = false;
  protected messages: string[] = [];
  protected readonly resetForm = this.formBuilder.nonNullable.group(
    {
      token: [this.token, [Validators.required]],
      email: [this.email, [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required, Validators.minLength(8)]],
    },
    {validators: passwordMatchValidator},
  );

  get showPasswordMismatch(): boolean {
    return (
      this.resetForm.hasError('passwordMismatch') &&
      (this.resetForm.get('password_confirmation')?.touched ?? false)
    );
  }

  protected reset(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      this.messages = ['Le formulaire contient encore des erreurs.'];
      return;
    }

    this.pending = true;
    this.authService
      .resetPassord(this.resetForm.getRawValue())
      .subscribe({
        next: () => {
          this.pending = false;
          this.cdr.markForCheck();
          void this.router.navigateByUrl('/welcome/success');
        },
        error: (error: unknown) => {
          this.pending = false;
          this.messages = extractApiErrors(error, 'Réinitialisation impossible.');
          this.cdr.markForCheck();
        },
      });
  }
}
