import {effect, Injectable, signal} from '@angular/core';
import DiceParser from '@3d-dice/dice-parser-interface'

@Injectable({
  providedIn: 'root'
})
export class DiceService {
  private sender = '';
  public DRP = new DiceParser();
  public showDiceBox = signal(true);
  public dice = signal<any>(null);
  public displayResult = signal<any>(null);
  public diceResult = signal<{ sender: string, result: any } | null>(null);

  constructor() {
    effect(() => {
      if (this.dice()) {
        console.log('dicebox ready');
        const displayResultsElem = document.querySelector('#dice-box .displayResults'); // Sélectionner .displayResults dans #dice-box
        if (displayResultsElem) {
          displayResultsElem.addEventListener('click', () => {
            this.dice().clear();
            setTimeout(() => {
              this.showDiceBox.set(false);
            }, 500);
          });
        }

        this.dice().onRollComplete = (rollResult: any) => {
          const reRolls = this.DRP.handleRerolls(rollResult);
          if (reRolls.length) {
            reRolls.forEach((roll: any) => this.dice().add(roll, roll.groupId));
            return;
          }
          const finalResults = this.DRP.parsedNotation ? this.DRP.parseFinalResults(rollResult) : rollResult
          this.displayResult().showResults(finalResults);
          this.diceResult.set({sender: this.sender, result: finalResults.value});
        }
      }
    });
  }
  clear() {
    this.DRP.clear();
    this.dice().clear();
    this.diceResult.set(null);
  }
  // Lancement du jet
  rollDice(roll?: string, sender: string = 'master') {
    if (roll) {
      this.clear();
      this.sender = sender;
      const parsedInput = this.DRP.parseNotation(roll);
      this.showDiceBox.set(true);
      this.dice().roll(parsedInput);
    }
  }
}
