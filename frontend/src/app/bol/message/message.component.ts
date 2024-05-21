import {Component, input} from '@angular/core';
import {MessagesModule} from "primeng/messages";
import {InlineSVGModule} from "ng-inline-svg-2";
import {SharedModule} from "primeng/api";
import {NgIf} from "@angular/common";

@Component({
  selector: 'bol-message',
  standalone: true,
  imports: [
    MessagesModule,
    InlineSVGModule,
    SharedModule,
    NgIf
  ],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss'
})
export class BolMessageComponent {
  type= input<'attr' | 'apt'>('attr')
}
