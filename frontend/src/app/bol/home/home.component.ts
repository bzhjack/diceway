import { Component } from '@angular/core';
import {CardModule} from "primeng/card";
import {Button} from "primeng/button";
import {NgIf} from "@angular/common";
import {RouterLink} from "@angular/router";

@Component({
  selector: 'bol-home',
  standalone: true,
  imports: [
    CardModule,
    Button,
    NgIf,
    RouterLink
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class BolHomeComponent {

}
