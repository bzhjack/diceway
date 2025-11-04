import {Component, inject, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Topbar} from './topbar/topbar';
import {AuthService} from './auth/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Topbar],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('diceway');
}
