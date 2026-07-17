import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {BolAvantageModel} from '../../../../models/bol-avantage.model';
import {BolDesavantageModel} from '../../../../models/bol-desavantage.model';
import {traitIconIsSvg, traitIconName, traitIconType} from '../../../../shared/trait-icon';
import {HeroAdvancedCreateTools} from '../../create.tools';

@Component({
  selector: 'bol-hero-advanced-trait-row',
  imports: [MatIconModule, MatMenuModule],
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

  protected readonly avantageIcon = computed(() => traitIconType(this.avantage()));
  protected readonly desavantageIcon = computed(() => traitIconType(this.desavantage()));

  protected readonly traitIconName = traitIconName;
  protected readonly traitIconIsSvg = traitIconIsSvg;
}
