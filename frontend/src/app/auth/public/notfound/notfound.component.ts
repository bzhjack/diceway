import { NgOptimizedImage } from '@angular/common';
import {Component} from '@angular/core';
import {RouterModule} from '@angular/router';
import {InlineSVGModule} from 'ng-inline-svg-2';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';

@Component({
    selector: 'app-notfound',
    imports: [
    CardModule,
    ButtonModule,
    RouterModule,
    InlineSVGModule,
    NgOptimizedImage
],
    templateUrl: './notfound.component.html',
    styleUrl: './notfound.component.scss'
})
export class NotfoundComponent {

}
