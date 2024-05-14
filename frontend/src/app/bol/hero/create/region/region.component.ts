import {AfterViewInit, Component, OnDestroy, ViewChild} from '@angular/core';
import {BolHeroService} from "../../../services/bol-hero.service";
import {Subscription} from "rxjs";
import {NgxSpinnerService} from "ngx-spinner";
import {DataViewModule} from "primeng/dataview";
import {NgForOf, NgIf} from "@angular/common";
import {PanelModule} from "primeng/panel";
import {ButtonModule} from "primeng/button";
import {DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";
import {ScrollPanel, ScrollPanelModule} from "primeng/scrollpanel";
import {TagModule} from 'primeng/tag';
import {TooltipModule} from 'primeng/tooltip';
import {InlineSVGModule} from "ng-inline-svg-2";
import {BolAvantageModel} from "../../../models/bol-avantage.model";
import {BolDesavantageModel} from "../../../models/bol-desavantage.model";
import {BolRegionModel} from "../../../models/bol-region.model";
import {FieldsetModule} from "primeng/fieldset";
import {MessagesModule} from "primeng/messages";
declare var $: any;
@Component({
  selector: 'app-region',
  standalone: true,
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
    MessagesModule
  ],
  templateUrl: './region.component.html',
  styleUrl: './region.component.scss'
})
export class BolRegionComponent implements OnDestroy, AfterViewInit {
  private subs?: Subscription;
  public regions: any[] = [];
  public currentRegion?: any;
  public selectedName?: string;
  @ViewChild('dtViewRegion') scrollRegion!: ScrollPanel;

  constructor(
    private hs: BolHeroService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private spinner: NgxSpinnerService) {
    const regionId= this.config.data.id_region;
    this.spinner.show();
    this.subs = this.hs.allRegions().subscribe({
      next: (regions: Array<any>) => {
        this.regions = regions;
        if (regionId) {
         this.setCurrentRegion(this.regions.find((region) => region.id === regionId));
        }
        this.spinner.hide();
      },
      error: () => {
        this.spinner.hide();
      }
    });
  }

  avantageDescription(avantage: BolAvantageModel) {
    let toolTip: { title: string, description: string | null }[] = [];
    if (avantage.de_bonus) {
      toolTip.push({title: 'Dé bonus', description: avantage.de_bonus_domaine});
    }
    if (avantage.attribut) {
      toolTip.push({title: 'Attribut', description: `${avantage.attribut}(${avantage.attribut_bonus})`});
    }
    if (avantage.description) {
      toolTip.push({title: 'Détails', description: avantage.description});
    }
    return toolTip;
  }

  desavantageDescription(avantage: BolDesavantageModel) {
    let toolTip: { title: string, description: string | null }[] = [];
    if (avantage.de_malus) {
      toolTip.push({title: 'Dé malus', description: avantage.de_malus_domaine});
    }
    if (avantage.attribut) {
      toolTip.push({title: 'Attribut', description: `${avantage.attribut}(${avantage.attribut_malus})`});
    }
    if (avantage.description) {
      toolTip.push({title: 'Détails', description: avantage.description});
    }
    return toolTip;
  }

  quit() {
    this.ref.close(null);
  }

  validate() {
    this.ref.close({region: this.currentRegion, nom: this.selectedName});
  }

  ngOnDestroy() {
    this.subs?.unsubscribe();
  }
  ngAfterViewInit() {
    //$('map').imageMapResize();
    //$('#bol-carte').maphilight({"strokeColor":"6aa84f", "strokeWidth": 2 });
  }

  setCurrentRegion(region: BolRegionModel | null) {
    if (region) {
      this.selectedName = undefined;
      region.nomsFeminins = region.noms.filter((nom: any) => nom.gender === 'F');
      region.nomsMasculins = region.noms.filter((nom: any) => nom.gender === 'M');
      this.currentRegion = region;
    }
  }
  setCurrentRegionFromMap(regionId: number) {
    this.scrollRegion.scrollTop(38* (regionId -1));
    this.setCurrentRegion(this.regions.find((region) => region.id === regionId));
  }
}
