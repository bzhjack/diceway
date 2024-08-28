import { Component } from '@angular/core';
import {RouterLink} from "@angular/router";

@Component({
  selector: 'bol-creature-home',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class BolCreatureHomeComponent {

}
