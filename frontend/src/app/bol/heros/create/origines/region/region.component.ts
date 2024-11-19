import {Component, computed, effect, inject, signal, ViewChild} from '@angular/core';
import {DataViewModule} from "primeng/dataview";
import {JsonPipe, NgForOf, NgIf} from "@angular/common";
import {PanelModule} from "primeng/panel";
import {ButtonModule} from "primeng/button";
import {DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";
import {ScrollPanel, ScrollPanelModule} from "primeng/scrollpanel";
import {TagModule} from 'primeng/tag';
import {TooltipModule} from 'primeng/tooltip';
import {InlineSVGModule} from "ng-inline-svg-2";
import {FieldsetModule} from "primeng/fieldset";
import {MessagesModule} from "primeng/messages";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {BolNomModel, BolRegionModel} from "../../../../models/bol-region.model";
import {BolHerosStateService} from "../../../../services/bol-heros-state.service";
import {BolHerosTraitRowComponent} from "./trait-row/trait-row.component";

@Component({
    selector: 'bol-heros-region',
    imports: [
        DataViewModule,
        NgForOf,
        PanelModule,
        ButtonModule,
        TooltipModule,
        ScrollPanelModule,
        TagModule,
        NgIf,
        InlineSVGModule,
        FieldsetModule,
        MessagesModule,
        OverlayPanelModule,
        JsonPipe,
        BolHerosTraitRowComponent
    ],
    templateUrl: './region.component.html',
    styleUrl: './region.component.scss'
})
export class BolHerosRegionComponent {
  readonly #bhss = inject(BolHerosStateService);
  readonly #ddc = inject(DynamicDialogConfig);


  protected regionId = signal<number>(this.#ddc.data.id_region || 0);
  protected selectedName = signal(this.#ddc.data.nom);
  protected regionList = this.#bhss.regionList;
  protected selectedRegion = computed(() => {
    return this.regionList()?.find((region: BolRegionModel) => Number(region.id) === Number(this.regionId()))
  });
  protected nomsFeminins = computed(() => this.selectedRegion()!.noms.filter((nom: BolNomModel) => nom.gender === 'F'));
  protected nomsMasculins = computed(() => this.selectedRegion()!.noms.filter((nom: BolNomModel) => nom.gender === 'M'));

  @ViewChild('regionPanel') scrollRegion!: ScrollPanel;

  constructor(public ref: DynamicDialogRef) {
    effect(() => {
      let regionElement = document.getElementById('region-' + this.regionId());
      if (regionElement) {
        this.scrollRegion?.scrollTop(regionElement?.offsetTop);
      }
    });
  }

  quit() {
    this.ref.close(null);
  }

  validate() {
    this.ref.close({region: this.selectedRegion(), nom: this.selectedName()});
  }

  setCurrentRegion(region: BolRegionModel | null) {
    if (region) {
      this.selectedName.set(undefined);
      this.regionId.set(region.id);
    }
  }
}
