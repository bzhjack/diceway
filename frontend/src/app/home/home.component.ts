import {Component} from '@angular/core';
import {TopbarComponent} from '../layout/topbar/topbar.component';
import {CardModule} from "primeng/card";
import {RouterLink} from "@angular/router";
import {BtnComponent} from "../shared/trash/trash.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    TopbarComponent,
    CardModule,
    RouterLink,
    BtnComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  constructor() { }
  ngOnInit(): void {
  }

  authenticationFailed(error: unknown) {
    console.error('Authentication failed: ' + error);
  }
}
