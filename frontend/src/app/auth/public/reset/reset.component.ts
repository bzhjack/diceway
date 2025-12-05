import { NgOptimizedImage } from '@angular/common';
import {Component, inject, OnDestroy} from '@angular/core';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {InlineSVGModule} from 'ng-inline-svg-2';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {InputGroupModule} from 'primeng/inputgroup';
import {InputGroupAddonModule} from 'primeng/inputgroupaddon';
import {InputTextModule} from 'primeng/inputtext';
import {ProgressBarModule} from 'primeng/progressbar';
import {AuthService} from '../../services/auth.service';
import {Subscription} from 'rxjs';
import {RegisterComponent} from '../register/register.component';
import {Message} from 'primeng/message';

@Component({
    selector: 'app-reset',
  imports: [
    CardModule,
    InputGroupModule,
    InputGroupAddonModule,
    InputTextModule,
    ButtonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    InlineSVGModule,
    ProgressBarModule,
    Message,
    NgOptimizedImage
],
    templateUrl: './reset.component.html',
    styleUrl: './reset.component.scss'
})
export class ResetComponent implements OnDestroy {
  fb = inject(FormBuilder);
  us = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  pending = false;
  sub?: Subscription;
  messages: string[] = [];

  resetForm = this.fb.nonNullable.group({
    token: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', [Validators.required, Validators.minLength(8)]]
  }, {validators: RegisterComponent.passwordMatch});

  constructor() {
    const token = this.route.snapshot.paramMap.get('token');
    const email = this.route.snapshot.queryParamMap.get('email');
    this.resetForm.patchValue({
      token: token ?? '',
      email: email ?? ''
    });
  }

  reset() {
    if (this.resetForm.valid) {
      const credentials = this.resetForm.getRawValue();
      this.sub?.unsubscribe();
      this.pending = true;
      this.sub = this.us.resetPassord(credentials).subscribe(
        {
          next: (result: any) => {
            this.pending = false;
            this.router.navigate(['/welcome/success']);
          },
          error: err => {
            this.pending = false;
            this.messages.push(err.error.message);
          }
        }
      );
    }
  }

  onError(controlName: string) {
    const control = this.resetForm.get(controlName);
    return control?.dirty && control.invalid;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
