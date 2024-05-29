import {Component, OnDestroy} from '@angular/core';
import {CardModule} from "primeng/card";
import {SharedModule} from "primeng/api";
import {DynamicDialogConfig, DynamicDialogModule, DynamicDialogRef} from "primeng/dynamicdialog";
import {DialogModule} from "primeng/dialog";
import {BolHerosService} from "../../../services/bol-heros.service";
import {NgxSpinnerService} from "ngx-spinner";
import {forkJoin, Subscription} from "rxjs";
import {NgForOf, NgIf, NgStyle} from "@angular/common";
import {FieldsetModule} from "primeng/fieldset";
import {TableModule} from "primeng/table";
import {BolAvantageModel} from "../../../models/bol-avantage.model";
import {BolDesavantageModel} from "../../../models/bol-desavantage.model";
import {ScrollPanelModule} from "primeng/scrollpanel";
import {InlineSVGModule} from "ng-inline-svg-2";
import {BolHeroCreateTools} from "../create.tools";
import {ButtonModule} from "primeng/button";
import {CheckboxModule} from "primeng/checkbox";
import {FormsModule} from "@angular/forms";
import {OverlayPanelModule} from "primeng/overlaypanel";

@Component({
  selector: 'app-trait',
  standalone: true,
  imports: [
    CardModule,
    SharedModule,
    DynamicDialogModule,
    DialogModule,
    NgIf,
    FieldsetModule,
    TableModule,
    NgForOf,
    ScrollPanelModule,
    InlineSVGModule,
    ButtonModule,
    CheckboxModule,
    FormsModule,
    OverlayPanelModule,
    NgStyle
  ],
  templateUrl: './trait.component.html',
  styleUrl: './trait.component.scss'
})
export class BolTraitComponent implements OnDestroy {
  private subs?: Subscription;
  public ready = false;

  public generalAvantages: BolAvantageModel[] = [];
  public generalDesavantages: BolDesavantageModel[] = [];

  public avantages: BolAvantageModel[] = [];
  public desavantages: BolDesavantageModel[] = [];

  selectedAvantages: BolAvantageModel[] = [];
  selectedDesavantages: BolDesavantageModel[] = [];
  selectedGeneralAvantages: BolAvantageModel[] = [];
  selectedGeneralDesavantages: BolDesavantageModel[] = [];

  avantagesIds: (string | null)[] = [];
  desavantagesIds: (string | null)[] = [];

  public heroismCost = 0;

  constructor(
    private hs: BolHerosService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private spinner: NgxSpinnerService) {

    const regionId= this.config.data.id_region;
    this.spinner.show();
    this.ready = false;
    this.subs = forkJoin([
      this.hs.region(regionId),
      this.hs.avantages(),
      this.hs.desavantages()
    ]).subscribe({
      next: (traits: any) => {
        this.avantages = traits[0].avantages;
        this.desavantages = traits[0].desavantages;
        const idAvantages = this.avantages.map(avantage => avantage.id);
        const idDesavantages = this.desavantages.map(desavantage => desavantage.id);
        this.generalAvantages = traits[1].filter((avantage: BolAvantageModel) => !idAvantages.includes(avantage.id));
        this.generalDesavantages = traits[2].filter((desavantage: BolDesavantageModel) => !idDesavantages.includes(desavantage.id));

        this.ready = true;
        this.spinner.hide();
      },
      error: () => {
        this.spinner.hide();
      }
    });
  }


  quit() {
    this.ref.close(null);
  }
  validate() {
    this.ref.close({avantages: this.avantagesIds, desavantages: this.desavantagesIds});
  }

  ngOnDestroy() {
    this.subs?.unsubscribe();
  }
  avantageDescription(avantage: BolAvantageModel) {
    return BolHeroCreateTools.avantageDescription(avantage);
  }

  desavantageDescription(desavantage: BolDesavantageModel) {
    return BolHeroCreateTools.desavantageDescription(desavantage);
  }
  checkSelection() {
    const totalNatalAvantages = this.selectedAvantages.length;
    const totalAvantages = this.selectedAvantages.length + this.selectedGeneralAvantages.length;

    const totalNatalDesavantages = this.selectedDesavantages.length;

    let costHeroism = 0;

    // Gestion premier avantage (natal)
    if (totalNatalAvantages === 0) {  // Si pas de premier alors aucun autre
      this.selectedGeneralAvantages =[];
    }

    // Gestion deuxième avantage (natal ou general)
    if (totalAvantages >= 2) {
      costHeroism += 1;
      // gestion du premier desavantage (natal)
      if (totalNatalDesavantages >= 1) {
        costHeroism -= 1;
      }
    }
    // Gestion troisième avantage (natal ou general)
    if (totalAvantages == 3) {
      costHeroism += 1;
      // gestion du deuxieme desavantage (natal ou global)
      if (this.selectedGeneralDesavantages.length >= 1 || this.selectedDesavantages.length == 2) {
        costHeroism -= 1;
      }
    }

    // Met à jour la liste des IDs d'avantages
    this.avantagesIds = [
      ...this.selectedAvantages.map((avantage: BolAvantageModel) => avantage.id),
      ...this.selectedGeneralAvantages.map((avantage: BolAvantageModel) => avantage.id)
    ];
    this.desavantagesIds = [
      ...this.selectedDesavantages.map((desavantage: BolDesavantageModel) => desavantage.id),
      ...this.selectedGeneralDesavantages.map((desavantage: BolDesavantageModel) => desavantage.id)
    ];


    // Ajuste les points d'héroïsme
    this.heroismCost = Math.max(costHeroism, 0);

  }
}
