import {AfterViewInit, Component, inject} from '@angular/core';
import DiceBox from "@3d-dice/dice-box";
import {DisplayResults} from '@3d-dice/dice-ui';
import DiceParser from '@3d-dice/dice-parser-interface';
import {NgIf, NgStyle} from "@angular/common";
import {DiceService} from "./dice.service";

@Component({
  selector: 'app-dice',
  standalone: true,
  imports: [
    NgStyle,
    NgIf
  ],
  templateUrl: './dice.component.html',
  styleUrl: './dice.component.scss'
})
export class DiceComponent implements AfterViewInit {
  protected diceService = inject(DiceService);
  showDiceBox = this.diceService.showDiceBox;

  ngAfterViewInit() {
    const displayResults = new DisplayResults("#dice-box");
    const dice = new DiceBox("#dice-box", {
      assetPath: "/frontend/assets/dice/",
      theme: "default",
      offscreen: true,
      scale: 6
    });

    dice.init().then((diceInstance: any) => {
      this.showDiceBox.set(false);
      this.diceService.dice.set(diceInstance);
      this.diceService.displayResult.set(displayResults);
    });

  }
}
