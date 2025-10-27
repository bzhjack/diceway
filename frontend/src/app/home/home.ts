import { Component } from '@angular/core';
import {Cloud} from '../cloud/cloud';

@Component({
  selector: 'app-home',
  imports: [
    Cloud
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {

}
