import { Component } from '@angular/core';
import {ButtonDirective} from "primeng/button";
import {HeaderComponent} from "../../../shared/header/header.component";
import {RouterLink} from "@angular/router";

@Component({
  selector: 'bol-quest',
  standalone: true,
  imports: [
    ButtonDirective,
    HeaderComponent,
    RouterLink
  ],
  templateUrl: './quest.component.html',
  styleUrl: './quest.component.scss'
})
export class BolQuestComponent {

}
