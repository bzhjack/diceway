import { Component, OnDestroy } from '@angular/core';
import { CardModule} from 'primeng/card';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { Router, RouterModule } from '@angular/router';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { Subscription } from 'rxjs';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessagesModule } from 'primeng/messages';
import { Message } from 'primeng/api';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    InputGroupModule,
    InputGroupAddonModule,
    InputTextModule,
    ButtonModule,
    RouterModule,
    InlineSVGModule,
    ProgressBarModule,
    MessagesModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnDestroy {
  pending = false;
  messages: Message[] = [];
  error: string | undefined;
  sub?: Subscription;
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, , Validators.minLength(8)]],
  });

  constructor(private fb: FormBuilder, private router: Router, public us: UserService) {
  }

  login() {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsDirty();
    });
    if (this.loginForm.valid) {
      this.messages= [];
      const credentials = this.loginForm.getRawValue();
      this.sub?.unsubscribe();
      this.pending = true;
      this.sub = this.us.login({
        email: credentials.email,
        password: credentials.password
      }).subscribe(
        {
        next: (result: any) => {
          this.pending = false;
          console.log(result);
          if (result && result.token) {
            this.router.navigate(['callback', result.token]);
          } else {
            this.router.navigate(['callback', 'error']);
          }
        },
        error: err => {
          this.pending = false;
          console.log(err);
          if (err.status === 401) {
            this.messages.push({ severity: 'error', summary: '', detail: 'Identifiants non valides'});
          }
          if (err.status === 403) {
            this.router.navigate(['resend', 'forbidden']);
          }
        }
      }
      );
    }
  }
  onError(controlName: string) {
    const control = this.loginForm.get(controlName);
    return control?.dirty && control.invalid;
  }
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
