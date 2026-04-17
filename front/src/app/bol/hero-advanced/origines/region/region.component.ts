import {ChangeDetectionStrategy, Component, computed, effect, inject, signal} from '@angular/core';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {MessageModule} from 'primeng/message';
import {ScrollPanelModule} from 'primeng/scrollpanel';
import {TagModule} from 'primeng/tag';
import {BolNomModel, BolRegionModel} from '../../../models/bol-region.model';
import {BolHerosStateService} from '../../../services/bol-heros-state.service';
import {HeroAdvancedTraitRowComponent} from './trait-row/trait-row.component';

@Component({
  selector: 'bol-hero-advanced-region',
  imports: [ButtonModule, CardModule, MessageModule, ScrollPanelModule, TagModule, HeroAdvancedTraitRowComponent],
  templateUrl: './region.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroAdvancedRegionComponent {
  private readonly herosStateService = inject(BolHerosStateService);
  private readonly dialogConfig = inject(DynamicDialogConfig);

  protected readonly regionId = signal<number>(Number(this.dialogConfig.data?.id_region ?? 0));
  protected readonly selectedName = signal<string | undefined>(this.dialogConfig.data?.nom);
  protected readonly regionList = this.herosStateService.regionList;
  protected readonly selectedRegion = computed(
    () => (this.regionList() ?? []).find((region) => Number(region.id) === Number(this.regionId())) ?? null,
  );
  protected readonly nomsFeminins = computed(() =>
    (this.selectedRegion()?.noms ?? []).filter((nom: BolNomModel) => nom.gender === 'F'),
  );
  protected readonly nomsMasculins = computed(() =>
    (this.selectedRegion()?.noms ?? []).filter((nom: BolNomModel) => nom.gender === 'M'),
  );

  constructor(public readonly ref: DynamicDialogRef) {
    effect(() => this.selectedRegion());
  }

  protected quit(): void {
    this.ref.close(null);
  }

  protected validate(): void {
    this.ref.close({region: this.selectedRegion(), nom: this.selectedName()});
  }

  protected setCurrentRegion(region: BolRegionModel): void {
    this.selectedName.set(undefined);
    this.regionId.set(region.id);
  }
}
