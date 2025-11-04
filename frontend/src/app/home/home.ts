import {Component} from '@angular/core';
import {Topbar} from '../topbar/topbar';
import {Panel} from 'primeng/panel';

@Component({
  selector: 'app-home',
  imports: [
    Topbar,
    Panel
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {

}
