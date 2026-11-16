import {ChangeDetectionStrategy, Component, computed, effect, inject, signal} from '@angular/core';
import {form, FormField} from '@angular/forms/signals';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {matchesTerm} from '../../../../shared/list.utils';
import {DwTagComponent} from '../../../../shared/dw-tag/dw-tag';
import {BolNomModel, BolRegionModel} from '../../../models/bol-region.model';
import {BolHerosStateService} from '../../../services/bol-heros-state.service';
import {RegionCarteComponent} from '../../../shared/region/region-carte';
import {HeroAdvancedTraitRowComponent} from './trait-row/trait-row.component';
import {HeroAdvancedRegionDialogData, HeroAdvancedRegionDialogResult} from '../../models/hero-advanced-region.model';

@Component({
  selector: 'bol-hero-advanced-region',
  imports: [
    FormField,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatDialogModule,
    DwTagComponent,
    HeroAdvancedTraitRowComponent,
    RegionCarteComponent,
  ],
  templateUrl: './region.component.html',
  styleUrl: './region.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroAdvancedRegionComponent {
  private readonly herosStateService = inject(BolHerosStateService);
  private readonly dialogData = inject<HeroAdvancedRegionDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject<MatDialogRef<HeroAdvancedRegionComponent, HeroAdvancedRegionDialogResult | null>>(MatDialogRef);

  protected readonly regionId = signal<number>(Number(this.dialogData.id_region ?? 0));
  protected readonly selectedName = signal<string | undefined>(this.dialogData.nom);
  protected readonly regionList = this.herosStateService.regionList;
  private readonly searchTerm = signal('');
  protected readonly searchField = form(this.searchTerm);
  protected readonly filteredRegions = computed(() =>
    (this.regionList() ?? []).filter((region) => matchesTerm(this.searchTerm(), region.region)),
  );
  protected readonly selectedRegion = computed(
    () => (this.regionList() ?? []).find((region) => Number(region.id) === Number(this.regionId())) ?? null,
  );
  protected readonly nomsFeminins = computed(() =>
    (this.selectedRegion()?.noms ?? []).filter((nom: BolNomModel) => nom.gender === 'F'),
  );
  protected readonly nomsMasculins = computed(() =>
    (this.selectedRegion()?.noms ?? []).filter((nom: BolNomModel) => nom.gender === 'M'),
  );

  protected readonly hoveredRegionId = signal<number | null>(null);

  constructor() {
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

  protected choisirSurLaCarte(regionId: number): void {
    const region = (this.regionList() ?? []).find((r) => Number(r.id) === regionId);
    if (region) {
      this.setCurrentRegion(region);
    }
  }

  protected setHoveredRegion(regionId: number | null): void {
    this.hoveredRegionId.set(regionId);
  }
}
