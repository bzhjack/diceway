import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { Subscription } from 'rxjs';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CardModule,
    InputGroupModule,
    InputGroupAddonModule,
    InputTextModule,
    ButtonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  pending = false;
  errorMsg: string | undefined;
  sub?: Subscription;
  
  registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', [Validators.required, Validators.minLength(8)]]
  });

  constructor(
    private us: UserService,
    private fb: FormBuilder, 
    private router: Router) { }


  register() {
    if (this.registerForm.valid) {
      const credentials = this.registerForm.getRawValue();
      this.sub?.unsubscribe();
      this.pending =true;
      this.sub = this.us.register(credentials).subscribe(
        {
          next: () => {
            this.pending =false;
            this.router.navigate(['notice']);
          },
          error: (err: any) => {
            this.pending =false;
            this.errorMsg = JSON.stringify(err.error?.message);
            if (err?.error?.errors?.email) {
              this.errorMsg = err.error?.errors?.email[0];
            }
          }
        }
      );
    }
  }
  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}


