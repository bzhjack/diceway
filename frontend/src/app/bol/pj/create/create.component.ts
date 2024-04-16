import { Component } from '@angular/core';
import {CardModule} from "primeng/card";
import {InputTextModule} from "primeng/inputtext";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [
    CardModule,
    InputTextModule,
    FormsModule
  ],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss'
})
export class BolPjCreateComponent {

}
