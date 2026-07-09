import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {MatMenuModule} from '@angular/material/menu';
import {InlineSvgDirective} from '../../../../../../shared/inline-svg/inline-svg.directive';
import {BolAvantageModel} from '../../../../../models/bol-avantage.model';
import {BolDesavantageModel} from '../../../../../models/bol-desavantage.model';
import {traitIconPath, traitIconType} from '../../../../../shared/trait-icon';
import {HeroAdvancedCreateTools} from '../../../create.tools';

@Component({
  selector: 'bol-hero-advanced-trait-row',
  imports: [MatMenuModule, InlineSvgDirective],
  templateUrl: './trait-row.component.html',
  styleUrl: './trait-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroAdvancedTraitRowComponent {
  readonly avantage = input<BolAvantageModel>();
  readonly desavantage = input<BolDesavantageModel>();
  readonly disabled = input(false);

  protected readonly avantageDescription = computed(() =>
    HeroAdvancedCreateTools.avantageDescription(this.avantage()),
  );
  protected readonly desavantageDescription = computed(() =>
    HeroAdvancedCreateTools.desavantageDescription(this.desavantage()),
  );

  protected readonly traitIconPath = traitIconPath;
  protected readonly traitIconType = traitIconType;
}
