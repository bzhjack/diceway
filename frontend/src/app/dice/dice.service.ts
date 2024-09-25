import {effect, inject, Injectable, signal} from '@angular/core';
import DiceParser from '@3d-dice/dice-parser-interface'
import {DialogService, DynamicDialogRef} from "primeng/dynamicdialog";
import {DiceResultsComponent} from "./dice-result/dice-result.component";
import {Subscription} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class DiceService {
  dialogService = inject(DialogService);
  subsClose: Subscription = new Subscription();
  ref: DynamicDialogRef | undefined;
  private sender = '';
  public DRP = new DiceParser();
  public showDiceBox = signal(true);
  public dice = signal<any>(null);
  public diceResult = signal<{ sender: string, result: any } | null>(null);

  constructor() {
    effect(() => {
      if (this.dice()) {
        console.log('dicebox ready');
        this.dice().onRollComplete = (rollResult: any) => {
          const reRolls = this.DRP.handleRerolls(rollResult);
          if (reRolls.length) {
            reRolls.forEach((roll: any) => this.dice().add(roll, roll.groupId));
            return;
          }
          const finalResults = this.DRP.parsedNotation ? this.DRP.parseFinalResults(rollResult) : rollResult
          this.showDiceResult(finalResults);
          this.diceResult.set({sender: this.sender, result: finalResults});
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

  showDiceResult(result: any) {
    this.ref = this.dialogService.open(DiceResultsComponent, {
      header: "Résultat",
      data: {
        result
      },
    });
    this.subsClose.unsubscribe();
    this.subsClose = this.ref.onClose.subscribe(() => {
      this.dice().clear();
      setTimeout(() => {
        this.showDiceBox.set(false);
      }, 500);
    });
  }
}
