import {AfterViewInit, Component, effect, inject} from '@angular/core';
import {TopbarComponent} from '../layout/topbar/topbar.component';
import {CardModule} from "primeng/card";
import {RouterLink} from "@angular/router";
import {BtnComponent} from "../shared/btn/btn.component";
import {DiceService} from "../dice/dice.service";


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    TopbarComponent,
    CardModule,
    RouterLink,
    BtnComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements  AfterViewInit {
  ds = inject(DiceService);
  constructor() {
    effect(() => {
      console.log("RESULTAT:",this.ds.diceResult());
    });
  }
  ngAfterViewInit() {
  }

  rollDice(ev: any) {
    ev.stopImmediatePropagation();
    this.ds.rollDice('9d6');
  }
}
