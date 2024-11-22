import {Component} from '@angular/core';
import {CardModule} from "primeng/card";
import {RouterLink} from "@angular/router";


@Component({
    selector: 'app-home',
    imports: [
        CardModule,
        RouterLink,
    ],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss'
})
export class HomeComponent {

}
