import {NgOptimizedImage} from '@angular/common';
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject} from '@angular/core';
import {AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {extractApiErrors} from '../../../core/auth/auth-form.utils';
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
  templateUrl: './register-page.html',
  styleUrl: './register-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class RegisterPageComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected pending = false;
  protected messages: string[] = [];
  protected readonly registerForm = this.formBuilder.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(5)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required, Validators.minLength(8)]],
    },
    {validators: RegisterPageComponent.passwordMatch},
  );

  static passwordMatch(group: AbstractControl): ValidationErrors | null {
    const password = group.value.password;
    const confirm = group.value.password_confirmation;
    if (password !== confirm) {
      group.get('password_confirmation')?.setErrors({notMatch: true});
    }
    return password === confirm ? null : {matchingError: true};
  }

  protected register(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.messages = [];
    this.pending = true;
    this.authService
      .register(this.registerForm.getRawValue())
      .subscribe({
        next: () => {
          this.pending = false;
          this.cdr.markForCheck();
          void this.router.navigateByUrl('/notice');
        },
        error: (error: unknown) => {
          this.pending = false;
          this.messages = extractApiErrors(error, 'Inscription impossible.');
          this.cdr.markForCheck();
        },
      });
  }
}
