import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { extractApiErrors } from '../../../core/auth/auth-form.utils';
import { AuthService } from '../../../core/auth/auth.service';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { Message } from 'primeng/message';

@Component({
  selector: 'app-resend-page',
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
  templateUrl: './resend-page.html',
  styleUrl: './resend-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResendPageComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly state = this.route.snapshot.paramMap.get('state');
  private readonly presetEmail = this.route.snapshot.queryParamMap.get('email') ?? '';

  protected pending = false;
  protected successMessage = '';
  protected messages: string[] = [];
  protected forbidden = this.state === 'forbidden';
  protected title = this.forbidden ? 'Adresse mail non vérifiée' : "Renvoyer l'email de confirmation";
  protected readonly resendForm = this.formBuilder.nonNullable.group({
    email: [this.presetEmail, [Validators.required, Validators.email]],
  });

  protected send(): void {
    this.messages = [];
    this.successMessage = '';
    if (this.resendForm.invalid) {
      this.resendForm.markAllAsTouched();
      this.messages = ['Une adresse email valide est requise.'];
      return;
    }

    this.pending = true;
    this.authService
      .sendMail(this.resendForm.controls.email.getRawValue())
      .subscribe({
        next: (response) => {
          this.pending = false;
          this.successMessage = response.message;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.pending = false;
          this.messages = extractApiErrors(error, 'Envoi impossible.');
          this.cdr.markForCheck();
        },
      });
  }

  protected onError(controlName: 'email'): boolean {
    const control = this.resendForm.controls[controlName];
    return control.invalid && control.touched;
  }
}
