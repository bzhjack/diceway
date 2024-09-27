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
  canvas: HTMLCanvasElement | null = null;
  private sender = '';
  private showResult = false;
  public DRP = new DiceParser();
  public dice = signal<any>(null);
  public diceResult = signal<{ sender: string, result: any, parsedResult: string } | null>(null);

  constructor() {
    effect(() => {
      if (this.dice()) {
        console.log('dicebox ready');
        this.canvas = document.querySelector('.dice-box-canvas') as HTMLCanvasElement;
        if (this.canvas) {
          this.canvas.addEventListener('click', (event: MouseEvent) => {
            if (!this.showResult) {
              event.stopPropagation();
              this.toggleCanvas();
            }
          });
        }

        this.toggleCanvas();
        this.dice().onRollComplete = (rollResult: any) => {
          const reRolls = this.DRP.handleRerolls(rollResult);
          if (reRolls.length) {
            reRolls.forEach((roll: any) => this.dice().add(roll, roll.groupId));
            return;
          }
          const finalResults = this.DRP.parsedNotation ? this.DRP.parseFinalResults(rollResult) : rollResult
          if (this.showResult) {
            this.showDiceResult(finalResults);
          }
          this.diceResult.set({sender: this.sender, result: finalResults.value, parsedResult: this.formatDiceResult(finalResults)});
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
  rollDice(roll?: string, sender: string = 'master', showResult = false) {
    if (roll) {
      this.toggleCanvas();
      this.clear();
      this.sender = sender;
      this.showResult = showResult;
      const parsedInput = this.DRP.parseNotation(roll);
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
      this.toggleCanvas();
    });
  }
  toggleCanvas() {
    if (this.canvas) {
      // Bascule l'ajout/suppression de la classe 'hide'
      this.canvas.classList.toggle('hide');
    }
  }

  // make this static for use by other systems?
  recursiveSearch(obj: any, searchKey: any, results: any[] = [], callback: any = null) {
    const r:any[] = results;
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      // if(key === searchKey && typeof value !== 'object'){
      if(key === searchKey){
        r.push(value);
        if(callback && typeof callback === 'function') {
          callback(obj)
        }
      } else if(value && typeof value === 'object'){
        this.recursiveSearch(value, searchKey, r, callback);
      }
    });
    return r;
  }


  formatDiceResult(data: any) {
    let rolls
    if(data.rolls && !Array.isArray(data.rolls)){
      rolls = Object.values(data.rolls).map(roll => roll)
    } else {
      // rolls = this.recursiveSearch(data,'rolls').flat()
      rolls = Object.values(this.recursiveSearch(data,'rolls')).map(group => {
        return Object.values(group)
      }).flat()
    }

    let total: any = 0
    if(data.hasOwnProperty('value')) {
      total = data.value
    } else {
      total = rolls.reduce((val,roll: any) => val + roll.value,0) as number;
      let modifier = data.reduce((val: any, roll: any) => Number(val) + Number(roll.modifier),0)
      total += Number(modifier);
    }

    total = isNaN(total) ? '...' : total

    if(typeof total === 'string'){
      const counter: { [key: string]: number } = {};

      // count up values
      rolls.forEach((roll: any) => {
        // if value is a string
        if (typeof roll.value === 'string') {
          if (roll.value && typeof roll.value === 'string') {
            if (counter[roll.value]) {
              counter[roll.value] = counter[roll.value] + 1
            } else {
              counter[roll.value] = 1
            }
          }
        }

        // if value is an array, then loop and count
        if (Array.isArray(roll.value)) {
          roll.value.forEach((val :any) => {
            if (val && typeof val === 'string') {
              if (counter[val]) {
                counter[val] = counter[val] + 1
              } else {
                counter[val] = 1
              }
            }
          })
        }
      })

      // clear total
      total = ''

      // sort the keys by alpha
      const sortedCounter = Object.fromEntries(Object.entries(counter).sort())

      // build the result
      Object.entries(sortedCounter).forEach(([key,val],i) => {
        if(i!==0){
          total += ', '
        }
        total += key + ": " + val
      })

    }


    let resultString = ''

    rolls.forEach((roll: any,i) => {
      let val
      let sides = roll.die || roll.sides || 'fate'

      if(i !== 0 && resultString.length) {
        if(typeof roll.value !== 'undefined' && (roll.value.length || typeof roll.value === 'number')) {
          resultString += ', '
        }
      }

      if(roll.success !== undefined && roll.success !== null){
        // val = roll.success ? `<svg class="success"><use href="${this.checkIcon}#checkmark"></use></svg>` : roll.failures > 0 ? `<svg class="failure"><use href="${this.cancelIcon}#cancel"></use></svg>` : `<svg class="null"><use href="${this.minusIcon}#minus"></use></svg>`
        val = roll.success ?
          `<img class="success" src="/assets/dice/icons/checkmark.svg" alt="Checkmark"/>` :
          roll.failures > 0 ?
            `<img class="failure"  src="/assets/dice/icons/cancel.svg" alt="Cancel"/>` :
            `<img class="null" s src="/assets/dice/icons/minus.svg" alt="Minus"/>`;
      } else {
        // convert to string in case value is 0 which would be evaluated as falsy
        val = roll.hasOwnProperty('value') ? roll.value.toString() : '...'
        // space comma separated values from arrays
        if(val.includes(',')){
          val = val.replace(',', ', ')
        }
      }

      let classes = `d${sides}`

      if(roll.critical === "success" || (roll.hasOwnProperty('value') && sides == roll.value)) {
        classes += ' crit-success'
      }
      if(roll.critical === "failure" || (roll.success === null && roll.hasOwnProperty('value') && roll.value <= 1 && sides !== 'fate')) {
        classes += ' crit-failure'
      }
      if(roll.drop) {
        classes += ' die-dropped'
      }
      if(roll.reroll) {
        classes += ' die-rerolled'
      }
      if(roll.explode) {
        classes += ' die-exploded'
      }
      if(sides === 'fate'){
        if(roll.value === 1){
          classes += ' crit-success'
        }
        if(roll.value === -1){
          classes += ' crit-failure'
        }
      }

      if(val && classes !== ''){
        val = `<div class='${classes.trim()}'>${val}</div>`
      }

      resultString += val
    });
    // Gestion des opérateurs
    data.ops?.forEach((op: string, index: number) => {
      const currentDice = data.dice[index + 1]; // Récupérer l'élément suivant dans dice
      if (currentDice && currentDice.type === 'number') {
        resultString = `(${resultString}) ${op} ${currentDice.value}`;
      }
    });
    resultString += ` = <strong>${total}</strong>`
    return resultString;
  }

}
