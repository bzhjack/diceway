import {Component} from '@angular/core';
import {TopbarComponent} from '../layout/topbar/topbar.component';
import {CardModule} from "primeng/card";
import {RouterLink} from "@angular/router";
import {BtnComponent} from "../shared/btn/btn.component";


@Component({
    selector: 'app-home',
    imports: [
        TopbarComponent,
        CardModule,
        RouterLink,
        BtnComponent
    ],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss'
})
export class HomeComponent {

}
