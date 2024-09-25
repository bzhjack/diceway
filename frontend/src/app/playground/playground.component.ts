import {Component} from '@angular/core';
import {BolHerosCardComponent} from "../bol/heros/card/card.component";


@Component({
  selector: 'app-playground',
  standalone: true,
  imports: [
    BolHerosCardComponent
  ],
  templateUrl: './playground.component.html',
  styleUrl: './playground.component.scss'
})
export class PlaygroundComponent {

}
