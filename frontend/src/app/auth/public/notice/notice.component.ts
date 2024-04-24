import {CommonModule} from '@angular/common';
import {Component} from '@angular/core';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {InlineSVGModule} from 'ng-inline-svg-2';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';

@Component({
  selector: 'app-notice',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    RouterModule,
    InlineSVGModule,
  ],
  templateUrl: './notice.component.html',
  styleUrl: './notice.component.scss'
})
export class NoticeComponent {
  reset =false;
  constructor(private route: ActivatedRoute) {
    this.reset = !!this.route.snapshot.paramMap.get('reset');
  }
}
