import {CommonModule, NgOptimizedImage} from '@angular/common';
import {Component, inject, OnDestroy} from '@angular/core';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {InlineSVGModule} from 'ng-inline-svg-2';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {InputGroupModule} from 'primeng/inputgroup';
import {InputGroupAddonModule} from 'primeng/inputgroupaddon';
import {InputTextModule} from 'primeng/inputtext';
import {Subscription} from 'rxjs';
import {ProgressBarModule} from 'primeng/progressbar';
import {Message} from 'primeng/message';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-forgotten',
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
    Message,
    NgOptimizedImage
  ],
  templateUrl: './forgotten.component.html',
  styleUrl: './forgotten.component.scss'
})
export class ForgottenComponent implements OnDestroy {
  router = inject(Router)
  fb = inject(FormBuilder);
  userService = inject(AuthService);
  messages: string[] = [];
  pending = false;
  forbidden = false;
  title: string = '';
  sub?: Subscription;
  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  send() {
    const credentials = this.forgotForm.getRawValue();
    this.messages = [];
    if (this.forgotForm.valid && credentials.email) {
      this.sub?.unsubscribe();
      this.pending = true;
      this.sub = this.userService.forgottenPassword(credentials.email).subscribe(
        {
          next: (result: any) => {
            this.pending = false;
            this.router.navigate(['notice/reset']);
          },
          error: (err: { error: { message: any; }; }) => {
            this.pending = false;
            console.log(err);
            this.messages.push( err.error.message);
          }
        }
      );
    }
  }

  onError(controlName: string) {
    const control = this.forgotForm.get(controlName);
    return control?.dirty && control.invalid;
  }
}
