import {Component, inject} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import {InputGroup} from 'primeng/inputgroup';
import {InputGroupAddon} from 'primeng/inputgroupaddon';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Message} from 'primeng/message';
import {Button} from 'primeng/button';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../../services/auth.service';
import {InputText} from 'primeng/inputtext';
import {finalize} from 'rxjs/operators';

@Component({
  selector: 'app-login',
  imports: [
    InputGroup,
    InputGroupAddon,
    Message,
    ReactiveFormsModule,
    Button,
    RouterLink,
    InputText,
    NgOptimizedImage
],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  fb = inject(FormBuilder);
  auth: AuthService = inject(AuthService);
  private readonly router = inject(Router);
  pending: boolean = false;
  messages: string[] = [];
  loginForm: FormGroup;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  login() {
    if (this.pending) return;
    this.messages = [];

    if (this.loginForm.invalid) {
      Object.values(this.loginForm.controls).forEach((ctrl) => ctrl.markAsDirty());
      this.messages.push('Veuillez corriger les erreurs du formulaire.');
      return;
    }

    const { email, password } = this.loginForm.value as { email: string; password: string };

    this.pending = true;
    this.auth
      .loginWithCredentials({ email, password })
      .pipe(finalize(() => (this.pending = false)))
      .subscribe({
        next: (data: any) => {
          if (data?.token) {
            sessionStorage.setItem('local_token', data.token);
            // Initialize in-memory profile for credentials-based login
            this.auth.initProfileFromLocalToken().finally(() => {
              this.router.navigate(['/profile']);
            });
            return;
          }
          this.router.navigate(['/profile']);
        },
        error: (err: any) => {
          const status = err?.status;
          if (status === 401) {
            this.messages.push('Identifiants invalides.');
            return;
          }
          if (status === 403) {
            this.messages.push("Email non vérifié. Vérifiez votre boîte mail ou renvoyez la vérification.");
            this.router.navigate(['/resend', 'forbidden']);
            return;
          }
          const serverMsg = err?.error?.error || err?.error?.message || err?.message || '';
          this.messages.push(`Erreur de connexion: ${serverMsg}`);
        },
      });
  }

  onError(controlName: string) {
    const control = this.loginForm.get(controlName);
    return control?.dirty && control.invalid;
  }

  loginWithGoogle() {
    this.auth.login();
  }

  logout() {
    this.auth.logout();
  }
}
