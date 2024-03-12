import { Routes } from '@angular/router';
import { LoginComponent } from './auth/public/login/login.component';
import { HomeComponent } from './home/home.component';
import { LoggedInGuardService } from './auth/guards/logged-in-guard.service';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: '', component: HomeComponent, canActivate: [LoggedInGuardService] },
    { path: '**', redirectTo: '/' },
];
