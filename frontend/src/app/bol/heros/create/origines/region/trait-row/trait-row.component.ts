import {Component, Input} from '@angular/core';
import {OverlayPanelModule} from "primeng/overlaypanel";
import {NgForOf, NgIf} from "@angular/common";
import {InlineSVGModule} from "ng-inline-svg-2";
import {CheckboxModule} from "primeng/checkbox";
import {BolAvantageModel} from "../../../../../models/bol-avantage.model";
import {BolDesavantageModel} from "../../../../../models/bol-desavantage.model";
import {BolHeroCreateTools} from "../../../create.tools";

@Component({
  selector: 'bol-heros-trait-row',
  standalone: true,
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
  @Input() avantage?: BolAvantageModel;
  @Input() desavantage?: BolDesavantageModel;
  @Input() disabled = false;
  avantageDescription(avantage: BolAvantageModel) {
    return BolHeroCreateTools.avantageDescription(avantage);
  }
  desavantageDescription(desavantage: BolDesavantageModel) {
    return BolHeroCreateTools.desavantageDescription(desavantage);
  }
}
