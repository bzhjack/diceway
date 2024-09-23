import {Injectable, signal} from '@angular/core';
import DiceParser from "@3d-dice/dice-parser-interface";

@Injectable({
  providedIn: 'root'
})
export class DiceService {
  public parser = new DiceParser();
  public showDiceBox = signal(true);
  public dice = signal<any>(null)
  constructor() { }
  rollDice(roll?: string) {
    if (roll) {
      this.showDiceBox.set(true);
      this.dice().clear()
      console.log(this.parser.parseNotation(roll));
      this.dice().roll(this.parser.parseNotation(roll));
    }
  }
}
