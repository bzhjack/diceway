import {Component, input} from '@angular/core';
import {InlineSVGModule} from "ng-inline-svg-2";
import {CheckboxModule} from "primeng/checkbox";
import {PopoverModule} from 'primeng/popover';
import {BolAvantageModel} from '../../../bol-models/bol-avantage.model';
import {BolDesavantageModel} from '../../../bol-models/bol-desavantage.model';
import {BolHeroCreateTools} from '../create.tools';

@Component({
  selector: 'bol-heros-trait-row',
  imports: [
    PopoverModule,
    InlineSVGModule,
    CheckboxModule
  ],
  templateUrl: './bol-hero-trait.html',
  standalone: true,
  styleUrl: './bol-hero-trait.scss'
})
export class BolHerosTrait {
  readonly avantage = input<BolAvantageModel>();
  readonly desavantage = input<BolDesavantageModel>();
  readonly disabled = input(false);

  avantageDescription(avantage: BolAvantageModel) {
    return BolHeroCreateTools.avantageDescription(avantage);
  }

  desavantageDescription(desavantage: BolDesavantageModel) {
    return BolHeroCreateTools.desavantageDescription(desavantage);
  }
  trackByItem(index: number, item: any) {
    return `${item.id}-${item.type}`;
  }
}
