import {AfterViewInit, Component, ElementRef, inject, Renderer2, ViewChild} from '@angular/core';
import {DynamicDialogConfig} from "primeng/dynamicdialog";

@Component({
  selector: 'app-dice-result',
  standalone: true,
  imports: [],
  templateUrl: './dice-result.component.html',
  styleUrl: './dice-result.component.scss'
})
export class DiceResultsComponent implements AfterViewInit {

  @ViewChild('resultContainer') displayContainer!: ElementRef;
  private timeout: number = 500;
  private even: boolean = false;
  private resultsElem1!: HTMLElement;
  private resultsElem2!: HTMLElement;
  private result: any = null;

  readonly config = inject(DynamicDialogConfig);
  readonly renderer = inject(Renderer2)

  constructor() {
    this.result = this.config.data.result;
  }

  ngAfterViewInit() {
    this.createDomElements();
    this.showResults(this.result);
  }
  createDomElements() {
    // Create parent element
    const elem = this.renderer.createElement('div');
    this.renderer.addClass(elem, 'diceResults');

    // Create resultsElem1
    this.resultsElem1 = this.renderer.createElement('div');
    this.renderer.addClass(this.resultsElem1, 'results');
    this.renderer.addClass(this.resultsElem1, 'hidden');
    this.renderer.setStyle(this.resultsElem1, 'transition', `all ${this.timeout}ms`);

    // Create resultsElem2
    this.resultsElem2 = this.renderer.createElement('div');
    this.renderer.addClass(this.resultsElem2, 'results');
    this.renderer.addClass(this.resultsElem2, 'hidden');
    this.renderer.setStyle(this.resultsElem2, 'transition', `all ${this.timeout}ms`);

    // Append both results elements to the parent element
    this.renderer.appendChild(elem, this.resultsElem1);
    this.renderer.appendChild(elem, this.resultsElem2);
    // Append the parent element to the target container (displayContainer)
    this.renderer.appendChild(this.displayContainer.nativeElement, elem);
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

  showResults(data: any){
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
    })
    resultString += ` = <strong>${total}</strong>`

    const currentElem = this[`resultsElem${this.even ? 2 : 1}`]
    currentElem.innerHTML = resultString
    currentElem.classList.add('showEffect')
    currentElem.classList.remove('hidden')
    currentElem.classList.remove('hideEffect')
    this.even = !this.even

  }

}
