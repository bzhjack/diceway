import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
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
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected pending = false;
  protected messages: string[] = [];
  protected readonly loginForm: FormGroup = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected login(): void {
    if (this.pending) {
      return;
    }

    this.messages = [];

    if (this.loginForm.invalid) {
      Object.values(this.loginForm.controls).forEach((control) => control.markAsDirty());
      this.messages = ['Veuillez corriger les erreurs du formulaire.'];
      return;
    }

    this.pending = true;
    this.authService
      .loginWithCredentials(this.loginForm.getRawValue() as { email: string; password: string })
      .pipe(
        finalize(() => {
          this.pending = false;
          this.cdr.markForCheck();
        }),
      )
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
            const email = this.loginForm.controls['email']?.getRawValue();
            this.cdr.markForCheck();
            void this.router.navigate(['/resend', 'forbidden'], {
              queryParams: { email },
            });
            return;
          }

          if (status === 401) {
            this.messages = ['Identifiants invalides.'];
            this.cdr.markForCheck();
            return;
          }

          this.messages = extractApiErrors(error, 'Connexion impossible.');
          this.cdr.markForCheck();
        },
      });
  }

  protected loginWithGoogle(): void {
    this.messages = [];
    this.authService.loginWithGoogle();
  }
}
