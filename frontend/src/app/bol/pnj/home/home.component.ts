import { Component } from '@angular/core';
import {ButtonDirective} from "primeng/button";
import {DropdownModule} from "primeng/dropdown";
import {FormsModule} from "@angular/forms";
import {HeaderComponent} from "../../../shared/header/header.component";
import {InputTextModule} from "primeng/inputtext";
import {RouterLink} from "@angular/router";

@Component({
  selector: 'bol-pnj-home',
  standalone: true,
    imports: [
        ButtonDirective,
        DropdownModule,
        FormsModule,
        HeaderComponent,
        InputTextModule,
        RouterLink
    ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class BolPnjHomeComponent {

}
