import {ChangeDetectionStrategy, Component, computed, effect, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatTooltipModule} from '@angular/material/tooltip';
import {startWith} from 'rxjs';
import {matchesTerm} from '../../../../shared/list.utils';
import {DwTagComponent} from '../../../../shared/dw-tag/dw-tag';
import {BolNomModel, BolRegionModel} from '../../../models/bol-region.model';
import {BolHerosStateService} from '../../../services/bol-heros-state.service';
import {REGION_MAP_COORDINATES} from './region-map-coordinates';
import {HeroAdvancedTraitRowComponent} from './trait-row/trait-row.component';

export interface HeroAdvancedRegionDialogData {
  id_region?: number;
  nom?: string;
}

export interface HeroAdvancedRegionDialogResult {
  region: BolRegionModel;
  nom?: string;
}

/** Point cliquable sur la carte, positionné en % via {@link REGION_MAP_COORDINATES}. */
interface RegionPin {
  readonly region: BolRegionModel;
  readonly x: number;
  readonly y: number;
}

@Component({
  selector: 'bol-hero-advanced-region',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
    MatDialogModule,
    DwTagComponent,
    HeroAdvancedTraitRowComponent,
  ],
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
  protected readonly searchCtrl = new FormControl('', {nonNullable: true});
  private readonly searchTerm = toSignal(this.searchCtrl.valueChanges.pipe(startWith('')), {initialValue: ''});
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

  /** Points cliquables sur la carte : régions du catalogue ayant une position connue. */
  protected readonly regionPins = computed<readonly RegionPin[]>(() =>
    (this.regionList() ?? []).flatMap((region) => {
      const coordinates = REGION_MAP_COORDINATES[Number(region.id)];
      return coordinates ? [{region, x: coordinates.x, y: coordinates.y}] : [];
    }),
  );
  protected readonly hoveredRegionId = signal<number | null>(null);
  protected readonly hoveredRegion = computed(
    () => (this.regionList() ?? []).find((region) => Number(region.id) === Number(this.hoveredRegionId())) ?? null,
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

  protected setHoveredRegion(regionId: number | null): void {
    this.hoveredRegionId.set(regionId);
  }
}
