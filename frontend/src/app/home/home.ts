import {Component} from '@angular/core';
import {Panel} from 'primeng/panel';
import {RouterLink} from '@angular/router';
import {Topbar} from '../shared/topbar/topbar';

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
