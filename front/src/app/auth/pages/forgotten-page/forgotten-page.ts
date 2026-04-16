import {NgOptimizedImage} from '@angular/common';
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {extractApiErrors} from '../../../core/auth/auth-form.utils';
import {AuthService} from '../../../core/auth/auth.service';
import {ButtonModule} from 'primeng/button';
import {InputGroupModule} from 'primeng/inputgroup';
import {InputGroupAddonModule} from 'primeng/inputgroupaddon';
import {InputTextModule} from 'primeng/inputtext';
import {Message} from 'primeng/message';

@Component({
  selector: 'app-forgotten-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputGroupModule,
    InputGroupAddonModule,
    InputTextModule,
    Message,
    NgOptimizedImage,
  ],
  templateUrl: './forgotten-page.html',
  styleUrl: './forgotten-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgottenPageComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected pending = false;
  protected messages: string[] = [];
  protected readonly forgotForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected send(): void {
    this.messages = [];
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      this.messages = ['Une adresse email valide est requise.'];
      return;
    }

    this.pending = true;
    this.authService
      .forgottenPassword(this.forgotForm.controls.email.getRawValue())
      .subscribe({
        next: () => {
          this.pending = false;
          this.cdr.markForCheck();
          void this.router.navigateByUrl('/notice/reset');
        },
        error: (error: unknown) => {
          this.pending = false;
          this.messages = extractApiErrors(error, 'Envoi impossible.');
          this.cdr.markForCheck();
        },
      });
  }

  protected onError(controlName: 'email'): boolean {
    const control = this.forgotForm.controls[controlName];
    return control.invalid && control.touched;
  }
}
