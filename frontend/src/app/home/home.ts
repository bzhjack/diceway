import {Component} from '@angular/core';
import {ProfileComponent} from '../auth/profile.component';

@Component({
  selector: 'app-home',
  imports: [
    ProfileComponent
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {

}
