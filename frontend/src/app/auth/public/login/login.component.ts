import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {InputGroup} from 'primeng/inputgroup';
import {InputGroupAddon} from 'primeng/inputgroupaddon';
import {Card} from 'primeng/card';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Message} from 'primeng/message';
import {Button} from 'primeng/button';
import {Router, RouterLink} from '@angular/router';
import {ProgressBar} from 'primeng/progressbar';
import {AuthService} from '../../services/auth.service';
import {InlineSVGDirective} from 'ng-inline-svg-2';
import {InputText} from 'primeng/inputtext';
import {UserService} from '../../services/user.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    InputGroup,
    InputGroupAddon,
    Card,
    Message,
    ReactiveFormsModule,
    Button,
    RouterLink,
    ProgressBar,
    InlineSVGDirective,
    InputText,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  fb = inject(FormBuilder);
  auth: AuthService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
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
    this.userService
      .login({ email, password })
      .pipe(finalize(() => (this.pending = false)))
      .subscribe({
        next: (data: any) => {
          if (data?.token) {
            sessionStorage.setItem('local_token', data.token);
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
