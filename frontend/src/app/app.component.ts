import { APP_BASE_HREF } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import {Component, OnDestroy} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UserService } from './auth/services/user.service';
import {Subscription} from "rxjs";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnDestroy {
  constructor(private us: UserService) {
  }
  ngOnDestroy() {
    this.us.clearTokens();
  }
}
