import {ChangeDetectionStrategy, Component, computed, effect, inject, signal} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {DwTagComponent} from '../../../../../shared/dw-tag/dw-tag';
import {BolNomModel, BolRegionModel} from '../../../../models/bol-region.model';
import {BolHerosStateService} from '../../../../services/bol-heros-state.service';
import {HeroAdvancedTraitRowComponent} from './trait-row/trait-row.component';

export interface HeroAdvancedRegionDialogData {
  id_region?: number;
  nom?: string;
}

export interface HeroAdvancedRegionDialogResult {
  region: BolRegionModel;
  nom?: string;
}

@Component({
  selector: 'bol-hero-advanced-region',
  imports: [MatButtonModule, MatIconModule, MatDialogModule, DwTagComponent, HeroAdvancedTraitRowComponent],
  templateUrl: './region.component.html',
  styleUrl: './region.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroAdvancedRegionComponent {
  private readonly herosStateService = inject(BolHerosStateService);
  private readonly dialogData = inject<HeroAdvancedRegionDialogData>(MAT_DIALOG_DATA);

  protected readonly regionId = signal<number>(Number(this.dialogData.id_region ?? 0));
  protected readonly selectedName = signal<string | undefined>(this.dialogData.nom);
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

  constructor(public readonly ref: MatDialogRef<HeroAdvancedRegionComponent, HeroAdvancedRegionDialogResult | null>) {
    effect(() => this.selectedRegion());
  }

  protected quit(): void {
    this.ref.close(null);
  }

  protected validate(): void {
    this.ref.close({region: this.selectedRegion()!, nom: this.selectedName()});
  }

  protected setCurrentRegion(region: BolRegionModel): void {
    this.selectedName.set(undefined);
    this.regionId.set(region.id);
  }
}
