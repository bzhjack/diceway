import {CommonModule} from '@angular/common';
import {Component, OnDestroy} from '@angular/core';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {InlineSVGModule} from 'ng-inline-svg-2';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {InputGroupModule} from 'primeng/inputgroup';
import {InputGroupAddonModule} from 'primeng/inputgroupaddon';
import {InputTextModule} from 'primeng/inputtext';
import {MessagesModule} from 'primeng/messages';
import {ProgressBarModule} from 'primeng/progressbar';
import {UserService} from '../../services/user.service';
import {Subscription} from 'rxjs';
import {Message} from 'primeng/api';
import {RegisterComponent} from '../register/register.component';

@Component({
  selector: 'app-reset',
  standalone: true,
  imports: [
    CommonModule,
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
    MessagesModule
  ],
  templateUrl: './reset.component.html',
  styleUrl: './reset.component.scss'
})
export class ResetComponent implements OnDestroy {
  pending = false;
  sub?: Subscription;
  messages: Message[] = [];

  resetForm = this.fb.group({
    token: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', [Validators.required, Validators.minLength(8)]]
  }, {validators: RegisterComponent.passwordMatch});

  constructor(
    private route: ActivatedRoute,
    private us: UserService,
    private fb: FormBuilder,
    private router: Router) {
      const token = this.route.snapshot.paramMap.get('token');
      const email = this.route.snapshot.paramMap.get('email');
      this.resetForm.patchValue({
        token,
        email
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
          this.messages.push({ severity: 'error', summary: '', detail: err.error.message});
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
