import {Component, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {TopbarComponent} from "./layout/topbar/topbar.component";
import {UserService} from "./auth/services/user.service";
import {AsyncPipe, NgIf} from "@angular/common";
import {NgxSpinnerModule} from "ngx-spinner";
import {ToastModule} from "primeng/toast";
import {DiceComponent} from "./dice/dice.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    NgxSpinnerModule,
    RouterOutlet,
    TopbarComponent,
    AsyncPipe,
    NgIf,
    ToastModule,
    DiceComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  us = inject(UserService);
  userObs = this.us.user$;
}
