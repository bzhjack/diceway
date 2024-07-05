import {Component, input} from '@angular/core';
import {MessagesModule} from "primeng/messages";
import {InlineSVGModule} from "ng-inline-svg-2";
import {SharedModule} from "primeng/api";
import {JsonPipe, NgForOf, NgIf} from "@angular/common";

@Component({
  selector: 'bol-message',
  standalone: true,
  imports: [
    MessagesModule,
    InlineSVGModule,
    SharedModule,
    NgIf,
    NgForOf,
    JsonPipe
  ],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss'
})
export class BolMessageComponent {
  type= input<'attr' | 'apt' | 'form-errors' | 'traits' | 'carrieres'>('attr')
  legend = input<string>('');
  data = input<any[]>();
}
