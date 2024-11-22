import {CommonModule} from '@angular/common';
import {Component, OnDestroy} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {InlineSVGModule} from 'ng-inline-svg-2';
import {Message} from 'primeng/api';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {InputGroupModule} from 'primeng/inputgroup';
import {InputGroupAddonModule} from 'primeng/inputgroupaddon';
import {InputTextModule} from 'primeng/inputtext';
import {MessagesModule} from 'primeng/messages';
import {ProgressBarModule} from 'primeng/progressbar';
import {Subscription} from 'rxjs';
import {UserService} from '../../services/user.service';


@Component({
    selector: 'app-register',
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
    templateUrl: './register.component.html',
    styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnDestroy {
  pending = false;
  sub?: Subscription;
  messages: Message[] = [];

  static passwordMatch(group: AbstractControl): ValidationErrors | null {
    const password = group.value.password;
    const confirm = group.value.password_confirmation;
    if (password !== confirm) {
      group.get('password_confirmation')?.setErrors({notMatch: true});
    }

    return password === confirm ? null : {matchingError: true};
  }

  registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(5)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', [Validators.required, Validators.minLength(8)]]
  }, {validators: RegisterComponent.passwordMatch});

  constructor(
    private us: UserService,
    private fb: FormBuilder,
    private router: Router) {
  }


  register() {
    if (this.registerForm.valid) {
      const credentials = this.registerForm.getRawValue();
      this.messages = [];
      this.sub?.unsubscribe();
      this.pending = true;
      this.sub = this.us.register(credentials).subscribe(
        {
          next: () => {
            this.pending = false;
            this.router.navigate(['notice']);
          },
          error: (err: any) => {
            this.pending = false;
            if (err?.error?.errors) {
              for (const key in err.error.errors) {
                this.messages.push({severity: 'error', summary: key, detail: err.error.errors[key][0]});
              }
            }

          }
        }
      );
    }
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  onError(controlName: string) {
    const control = this.registerForm.get(controlName);
    return control?.dirty && control.invalid;
  }
}


