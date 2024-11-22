import {Component, input} from '@angular/core';
import {CardModule} from "primeng/card";
import {RouterLink} from "@angular/router";

@Component({
    selector: 'bol-home-card',
    imports: [
        CardModule,
        RouterLink
    ],
    templateUrl: './home-card.component.html',
    styleUrl: './home-card.component.scss'
})
export class BolHomeCardComponent {
 title = input('');
 type= input('');
}
