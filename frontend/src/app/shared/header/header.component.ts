import {Component, input, output} from '@angular/core';
import {RouterLink} from "@angular/router";

@Component({
    selector: 'app-header',
    imports: [
        RouterLink
    ],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss'
})
export class HeaderComponent {
  legend = input();
  legendClicked = output<any>();
}
