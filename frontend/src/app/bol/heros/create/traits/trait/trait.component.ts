import {Component, computed, inject, input} from '@angular/core';
import {OverlayPanelModule} from "primeng/overlaypanel";
import {BolAvantageModel} from "../../../../models/bol-avantage.model";
import {BolDesavantageModel} from "../../../../models/bol-desavantage.model";
import {NgForOf, NgIf} from "@angular/common";
import {InlineSVGModule} from "ng-inline-svg-2";
import {BolHeroCreateTools} from "../../create.tools";
import {CheckboxModule} from "primeng/checkbox";
import {BolHerosTraitsModel} from "../../../../models/bol-trait.model";
import {BolHerosStateService} from "../../../../services/bol-heros-state.service";
import {TooltipModule} from "primeng/tooltip";

@Component({
    selector: 'bol-heros-trait',
  imports: [
    OverlayPanelModule,
    NgIf,
    InlineSVGModule,
    NgForOf,
    CheckboxModule,
    TooltipModule
  ],
    templateUrl: './trait.component.html',
    styleUrl: './trait.component.scss'
})
export class BolHerosTraitComponent {
  readonly #herosStateService = inject(BolHerosStateService);

  protected avantagesList = this.#herosStateService.avantagesList;
  protected desavantageList = this.#herosStateService.desavantagesList;

  trait = input<BolHerosTraitsModel | null>(null);
  protected avantage = computed(() => {
    return this.trait()?.type === 'A' ? this.avantagesList()?.find((item) => Number(item.id) === Number(this.trait()!.traitable_id)) : null;
  });
  desavantage = computed(() => {
    return this.trait()?.type === 'D' ? this.desavantageList()?.find((item) => Number(item.id) === Number(this.trait()!.traitable_id)) : null;
  });

  avantageDescription(avantage: BolAvantageModel | null | undefined) {
    return BolHeroCreateTools.avantageDescription(avantage as BolAvantageModel);
  }

  desavantageDescription(desavantage: BolDesavantageModel | null | undefined) {
    return BolHeroCreateTools.desavantageDescription(desavantage as BolDesavantageModel);
  }
}
