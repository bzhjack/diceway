import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatTooltipModule} from '@angular/material/tooltip';
import {InlineSvgDirective} from '../../../../shared/inline-svg/inline-svg.directive';
import {BolHerosTraitsModel} from '../../../models/bol-trait.model';
import {BolHerosStateService} from '../../../services/bol-heros-state.service';
import {traitIconPath, traitIconType} from '../../../shared/trait-icon';
import {HeroAdvancedCreateTools} from '../../create.tools';

@Component({
  selector: 'bol-hero-advanced-trait',
  imports: [MatIconModule, MatMenuModule, MatTooltipModule, InlineSvgDirective],
  templateUrl: './trait.component.html',
  styleUrl: './trait.component.scss',
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

  protected readonly traitIconPath = traitIconPath;
  protected readonly traitIconType = traitIconType;
}
