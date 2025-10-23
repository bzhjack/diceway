import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {InputGroup} from 'primeng/inputgroup';
import {InputGroupAddon} from 'primeng/inputgroupaddon';
import {Card} from 'primeng/card';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Message} from 'primeng/message';
import {Button} from 'primeng/button';
import {RouterLink} from '@angular/router';
import {ProgressBar} from 'primeng/progressbar';
import {AuthService} from '../../services/auth.service';
import {InlineSVGDirective} from 'ng-inline-svg-2';
import {InputText} from 'primeng/inputtext';


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
  auth: AuthService = inject(AuthService);
  pending: boolean =false;
  messages: string[] = [];
  loginForm: FormGroup;
  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, , Validators.minLength(8)]],
    });
  }
  login() {

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
