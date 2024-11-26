import {Component, input} from '@angular/core';
import {OverlayPanelModule} from "primeng/overlaypanel";
import {NgForOf, NgIf} from "@angular/common";
import {InlineSVGModule} from "ng-inline-svg-2";
import {CheckboxModule} from "primeng/checkbox";
import {BolAvantageModel} from "../../../../../models/bol-avantage.model";
import {BolDesavantageModel} from "../../../../../models/bol-desavantage.model";
import {BolHeroCreateTools} from "../../../create.tools";

@Component({
    selector: 'bol-heros-trait-row',
    imports: [
        OverlayPanelModule,
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
