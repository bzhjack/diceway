import {Component, input} from '@angular/core';
import {InlineSVGModule} from "ng-inline-svg-2";

@Component({
    selector: 'app-btn',
    imports: [
        InlineSVGModule
    ],
    templateUrl: './btn.component.html',
    styleUrl: './btn.component.scss'
})
export class BtnComponent {
  icon = input<string>('trash');
  type = input<null | 'warn' | 'info'>(null);
}
