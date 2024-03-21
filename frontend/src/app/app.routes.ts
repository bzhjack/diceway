import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoggedInGuardService } from './auth/guards/logged-in-guard.service';
import { ForgottenComponent } from './auth/public/forgotten/forgotten.component';
import { LoginComponent } from './auth/public/login/login.component';
import { RegisterComponent } from './auth/public/register/register.component';
import { NoticeComponent } from './auth/public/notice/notice.component';
import { ResendComponent } from './auth/public/resend/resend.component';
import { WelcomeComponent } from './auth/public/welcome/welcome.component';
import { NotfoundComponent } from './auth/public/notfound/notfound.component';

export const routes: Routes = [
    // Accès public
    { path: 'login', component: LoginComponent }, // Connexion à l'application
    { path: 'forgotten', component: ForgottenComponent }, // Mot de passe oublié
    { path: 'register', component: RegisterComponent }, // Création d'un compte
    { path: 'welcome', component: WelcomeComponent }, // Création d'un compte
    { path: 'resend', component: ResendComponent }, // Renvoi d'un mail de confirmation
    { path: 'resend/:forbidden', component: ResendComponent }, // Renvoi d'un email de confirmation suite à login
    { path: 'notice', component: NoticeComponent }, // Notification de création de compte
    { path: 'notfound', component: NotfoundComponent }, // Echec à la verification du mail ou 404 standard

    { path: '', component: HomeComponent, canActivate: [LoggedInGuardService] },
    { path: '**', redirectTo: '/' },
];
