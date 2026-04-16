import {NgOptimizedImage} from '@angular/common';
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {finalize} from 'rxjs/operators';
import {extractApiErrors} from '../../../core/auth/auth-form.utils';
import {AuthService} from '../../../core/auth/auth.service';
import {Button} from 'primeng/button';
import {InputGroup} from 'primeng/inputgroup';
import {InputGroupAddon} from 'primeng/inputgroupaddon';
import {InputText} from 'primeng/inputtext';
import {Message} from 'primeng/message';

@Component({
  selector: 'app-login-page',
  imports: [
    InputGroup,
    InputGroupAddon,
    Message,
    ReactiveFormsModule,
    Button,
    RouterLink,
    InputText,
    NgOptimizedImage,
  ],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  protected onError(controlName: string): boolean {
    const control = this.loginForm.get(controlName);
    return !!control && control.dirty && control.invalid;
  }

  protected loginWithGoogle(): void {
    this.messages = [];
    this.authService.loginWithGoogle();
  }
}
