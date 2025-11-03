import {CommonModule, NgOptimizedImage} from '@angular/common';
import {Component, inject} from '@angular/core';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {InlineSVGModule} from 'ng-inline-svg-2';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';

@Component({
    selector: 'app-notice',
    imports: [
        CommonModule,
        CardModule,
        ButtonModule,
        RouterModule,
        InlineSVGModule,
        NgOptimizedImage,
    ],
    templateUrl: './notice.component.html',
    styleUrl: './notice.component.scss'
})
export class NoticeComponent {
  private route = inject(ActivatedRoute);

  reset = false;

  constructor() {
    this.reset = !!this.route.snapshot.paramMap.get('reset');
  }
}
