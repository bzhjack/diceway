import {Component, OnInit} from '@angular/core';
import DiceBox from "@3d-dice/dice-box";

@Component({
  selector: 'app-dice',
  standalone: true,
  imports: [],
  templateUrl: './dice.component.html',
  styleUrl: './dice.component.scss'
})
export class DiceComponent implements OnInit {
  public dice: any;

  ngOnInit() {
     const dice = new DiceBox("#dice-box", {
        assetPath: "/frontend/assets/dice/",
      });
    dice.init().then((plop: any) => {
      console.log("dice loaded", plop);
      this.dice = plop;
    });
  }
  roll() {
    this.dice.roll("2d20");
  }
}
