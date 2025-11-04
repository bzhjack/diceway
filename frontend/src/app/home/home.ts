import {Component} from '@angular/core';
import {Topbar} from '../topbar/topbar';

@Component({
  selector: 'app-home',
  imports: [
    Topbar
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {

}
