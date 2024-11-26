import {AfterViewInit, Component, ElementRef, inject, Renderer2, viewChild} from '@angular/core';
import {DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";
import {DiceService} from "../dice.service";

@Component({
    selector: 'app-dice-result',
    templateUrl: './dice-result.component.html',
    styleUrl: './dice-result.component.scss'
})
export class DiceResultsComponent implements AfterViewInit {
  private  diceService = inject(DiceService);
  readonly displayContainer = viewChild.required<ElementRef>('resultContainer');
  private timeout: number = 500;
  private even: boolean = false;
  private resultsElem1!: HTMLElement;
  private resultsElem2!: HTMLElement;
  private result: any = null;

  readonly config = inject(DynamicDialogConfig);
  readonly renderer = inject(Renderer2)

  constructor(public ref: DynamicDialogRef) {
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
    this.renderer.appendChild(this.displayContainer().nativeElement, elem);
  }
  showResults(data: any){
    const resultString = this.diceService.formatDiceResult(data);
    console.log(resultString);
    const currentElem = this[`resultsElem${this.even ? 2 : 1}`]
    currentElem.innerHTML = resultString
    currentElem.classList.add('showEffect')
    currentElem.classList.remove('hidden')
    currentElem.classList.remove('hideEffect')
    this.even = !this.even
  }
  quit() {
    this.ref.close(null);
  }

}
