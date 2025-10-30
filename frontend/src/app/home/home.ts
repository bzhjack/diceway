import { Component } from '@angular/core';
import {SmokeScene} from '../smoke/smoke-scene';

@Component({
  selector: 'app-home',
  imports: [
    SmokeScene
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {

}
