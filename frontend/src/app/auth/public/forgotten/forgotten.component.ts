import {CommonModule} from '@angular/common';
import {Component} from '@angular/core';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {InlineSVGModule} from 'ng-inline-svg-2';
import {Message} from 'primeng/api';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {InputGroupModule} from 'primeng/inputgroup';
import {InputGroupAddonModule} from 'primeng/inputgroupaddon';
import {InputTextModule} from 'primeng/inputtext';
import {Subscription} from 'rxjs';
import {UserService} from '../../services/user.service';
import {ProgressBarModule} from 'primeng/progressbar';
import {MessagesModule} from 'primeng/messages';

@Component({
  selector: 'app-forgotten',
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
  templateUrl: './forgotten.component.html',
  styleUrl: './forgotten.component.scss'
})
export class ForgottenComponent {
  messages: Message[] = [];
  pending = false;
  forbidden = false;
  title: string = '';
  sub?: Subscription;
  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  constructor(private fb: FormBuilder, private us: UserService, private router: Router) {

  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  send() {
    const credentials = this.forgotForm.getRawValue();
    this.messages = [];
    if (this.forgotForm.valid && credentials.email) {
      this.sub?.unsubscribe();
      this.pending = true;
      this.sub = this.us.forgottenPassword(credentials.email).subscribe(
        {
          next: (result: any) => {
            this.pending = false;
            this.router.navigate(['notice/reset']);
          },
          error: err => {
            this.pending = false;
            console.log(err);
            this.messages.push({severity: 'error', summary: '', detail: err.error.message});
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
