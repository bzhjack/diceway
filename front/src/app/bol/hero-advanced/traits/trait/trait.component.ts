import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {PopoverModule} from 'primeng/popover';
import {TooltipModule} from 'primeng/tooltip';
import {InlineSVGModule} from 'ng-inline-svg-2';
import {BolHerosTraitsModel} from '../../../models/bol-trait.model';
import {BolHerosStateService} from '../../../services/bol-heros-state.service';
import {HeroAdvancedCreateTools} from '../../create.tools';

@Component({
  selector: 'bol-hero-advanced-trait',
  imports: [PopoverModule, TooltipModule, InlineSVGModule],
  templateUrl: './trait.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroAdvancedTraitComponent {
  private readonly herosStateService = inject(BolHerosStateService);

  readonly trait = input<BolHerosTraitsModel | null>(null);

  protected readonly avantage = computed(() => {
    const currentTrait = this.trait();
    if (!currentTrait || currentTrait.type !== 'A') {
      return null;
    }

    return (this.herosStateService.avantagesList() ?? []).find(
      (item) => Number(item.id) === Number(currentTrait.traitable_id),
    ) ?? null;
  });

  protected readonly desavantage = computed(() => {
    const currentTrait = this.trait();
    if (!currentTrait || currentTrait.type !== 'D') {
      return null;
    }

    return (this.herosStateService.desavantagesList() ?? []).find(
      (item) => Number(item.id) === Number(currentTrait.traitable_id),
    ) ?? null;
  });

  protected readonly avantageDescription = computed(() =>
    HeroAdvancedCreateTools.avantageDescription(this.avantage()),
  );
  protected readonly desavantageDescription = computed(() =>
    HeroAdvancedCreateTools.desavantageDescription(this.desavantage()),
  );
}
