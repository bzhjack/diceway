import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoggedInGuardService } from './auth/guards/logged-in-guard.service';
import { ForgottenComponent } from './auth/public/forgotten/forgotten.component';
import { LoginComponent } from './auth/public/login/login.component';
import { RegisterComponent } from './auth/public/register/register.component';
import { NoticeComponent } from './auth/public/notice/notice.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'forgotten', component: ForgottenComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'notice', component: NoticeComponent },
    { path: '', component: HomeComponent, canActivate: [LoggedInGuardService] },
    { path: '**', redirectTo: '/' },
];
