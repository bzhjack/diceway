import {Component, input} from '@angular/core';
import {MessagesModule} from "primeng/messages";
import {InlineSVGModule} from "ng-inline-svg-2";
import {SharedModule} from "primeng/api";
import {NgForOf, NgIf} from "@angular/common";

@Component({
    selector: 'bol-message',
  imports: [
    MessagesModule,
    InlineSVGModule,
    SharedModule,
    NgIf,
    NgForOf
  ],
    templateUrl: './message.component.html',
    styleUrl: './message.component.scss'
})
export class BolMessageComponent {
  type = input<'lang' | 'attr' | 'apt' | 'orig' | 'form-errors' | 'traits' | 'carrieres' | 'form-warn' | 'form-info'>('attr')
  legend = input<string>('');
  data = input<any[]>();
}
