import {Component, input} from '@angular/core';
import {NgForOf, NgIf} from "@angular/common";
import {InlineSVGModule} from "ng-inline-svg-2";
import {CheckboxModule} from "primeng/checkbox";
import {PopoverModule} from 'primeng/popover';
import {BolAvantageModel} from '../bol/bol-models/bol-avantage.model';
import {BolDesavantageModel} from '../bol/bol-models/bol-desavantage.model';
import {BolHeroCreateTools} from '../bol/bol-heros/bol-hero-form/create.tools';

@Component({
    selector: 'bol-heros-trait-row',
    imports: [
        PopoverModule,
        NgIf,
        InlineSVGModule,
        NgForOf,
        CheckboxModule
    ],
    templateUrl: './trait-row.component.html',
    styleUrl: './trait-row.component.scss'
})
export class BolHerosTraitRowComponent {
  readonly avantage = input<BolAvantageModel>();
  readonly desavantage = input<BolDesavantageModel>();
  readonly disabled = input(false);

  avantageDescription(avantage: BolAvantageModel) {
    return BolHeroCreateTools.avantageDescription(avantage);
  }

  desavantageDescription(desavantage: BolDesavantageModel) {
    return BolHeroCreateTools.desavantageDescription(desavantage);
  }
}
