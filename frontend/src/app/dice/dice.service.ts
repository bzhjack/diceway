import {effect, Injectable, signal} from '@angular/core';
import DiceParser from '@3d-dice/dice-parser-interface'

@Injectable({
  providedIn: 'root'
})
export class DiceService {
  public DRP = new DiceParser();
  public showDiceBox = signal(true);
  public dice = signal<any>(null);
  public displayResult = signal<any>(null);
  constructor() {
    effect(() => {
      if (this.dice()) {
        this.dice().onRollComplete = (rollResult: any) => {
          const rerolls = this.DRP.handleRerolls(rollResult);
          if (rerolls.length) {
            rerolls.forEach((roll: any) => this.dice().add(roll, roll.groupId));
            return;
          }
          const finalResults = this.DRP.parsedNotation ? this.DRP.parseFinalResults(rollResult) : rollResult
          this.displayResult().showResults(finalResults);
        }
      }

    });
  }
  // Lancement du jet
  rollDice(roll?: string) {
    if (roll) {
    this.DRP.clear();
    this.dice().clear();
    const parsedInput = this.DRP.parseNotation(roll);
    this.showDiceBox.set(true);
    this.dice().roll(parsedInput);
    }
  }
}
