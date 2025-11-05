import {Component} from '@angular/core';
import {Topbar} from '../topbar/topbar';
import {Panel} from 'primeng/panel';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [
    Topbar,
    Panel,
    RouterLink
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {

}
