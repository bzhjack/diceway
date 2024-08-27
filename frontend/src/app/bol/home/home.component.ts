import { Component } from '@angular/core';
import {CardModule} from "primeng/card";
import {Button} from "primeng/button";

@Component({
  selector: 'bol-home',
  standalone: true,
  imports: [
    CardModule,
    Button
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class BolHomeComponent {

}
