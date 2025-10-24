import {CommonModule} from '@angular/common';
import { Component, inject } from '@angular/core';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {InlineSVGModule} from 'ng-inline-svg-2';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';

@Component({
    selector: 'app-welcome',
    imports: [
        CommonModule,
        CardModule,
        ButtonModule,
        RouterModule,
        InlineSVGModule,
    ],
    templateUrl: './welcome.component.html',
    styleUrl: './welcome.component.scss'
})
export class WelcomeComponent {
  private route = inject(ActivatedRoute);

  success = false;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    this.success = !!this.route.snapshot.paramMap.get('success');
  }
}
