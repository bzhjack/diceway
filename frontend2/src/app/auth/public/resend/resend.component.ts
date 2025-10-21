import {Component, OnDestroy} from '@angular/core';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {Subscription} from 'rxjs';
import {UserService} from '../../services/user.service';
import {CardModule} from 'primeng/card';
import {CommonModule} from '@angular/common';
import {InputGroupModule} from 'primeng/inputgroup';
import {InputGroupAddonModule} from 'primeng/inputgroupaddon';
import {InputTextModule} from 'primeng/inputtext';
import {ButtonModule} from 'primeng/button';
import {InlineSVGModule} from 'ng-inline-svg-2';
import {ProgressBarModule} from 'primeng/progressbar';
import {MessagesModule} from 'primeng/messages';
import {Message} from 'primeng/api';

@Component({
    selector: 'app-resend',
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
    templateUrl: './resend.component.html',
    styleUrl: './resend.component.scss'
})
export class ResendComponent implements OnDestroy {
  messages: Message[] = [];
  pending = false;
  forbidden = false;
  title: string = '';
  sub?: Subscription;
  resendForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  constructor(private route: ActivatedRoute, private fb: FormBuilder, private us: UserService, private router: Router) {
    this.forbidden = !!this.route.snapshot.paramMap.get('forbidden');
    this.title = 'Renvoyer l\'email de confirmation';
    if (this.forbidden) {
      this.title = 'Adresse mail non vérifiée';
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  send() {
    const credentials = this.resendForm.getRawValue();
    this.messages = [];
    if (this.resendForm.valid && credentials.email) {
      this.sub?.unsubscribe();
      this.pending = true;
      this.sub = this.us.sendMail(credentials.email).subscribe(
        {
          next: (result: any) => {
            this.pending = false;
            this.router.navigate(['notice']);
          },
          error: err => {
            this.pending = false;
            this.messages.push({severity: 'error', summary: '', detail: err.error.message});
          }
        }
      );
    }
  }

  onError(controlName: string) {
    const control = this.resendForm.get(controlName);
    return control?.dirty && control.invalid;
  }
}
