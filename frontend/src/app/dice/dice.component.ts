import {AfterViewInit, Component, inject} from '@angular/core';
import DiceBox from "@3d-dice/dice-box";
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

  ngAfterViewInit() {
    const dice = new DiceBox("#dice-box", {
      assetPath: "/frontend/assets/dice/",
      theme: "default",
      offscreen: true,
      scale: 6,
      themeColor: '#83271B'
    });

    dice.init().then((diceInstance: any) => {
      this.diceService.dice.set(diceInstance);
    });

  }
}
