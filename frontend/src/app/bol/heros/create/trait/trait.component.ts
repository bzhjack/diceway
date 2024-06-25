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
import {ButtonModule} from "primeng/button";
import {CheckboxModule} from "primeng/checkbox";
import {FormsModule} from "@angular/forms";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {BolTraitRowComponent} from "./trait-row/trait-row.component";

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
    NgStyle,
    BolTraitRowComponent
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

  private allAvg: BolAvantageModel[] = [];
  private allDesavg: BolDesavantageModel[] = [];


  selectedNatalAvantages: BolAvantageModel[] = [];
  selectedNatalDesavantages: BolDesavantageModel[] = [];
  selectedGeneralAvantages: BolAvantageModel[] = [];
  selectedGeneralDesavantages: BolDesavantageModel[] = [];

  avantagesIds: (number | null)[] = [];
  desavantagesIds: (number | null)[] = [];

  public heroismCost = 0;

  constructor(
    private hs: BolHerosService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private spinner: NgxSpinnerService) {
    const regionId = this.config.data.id_region;
    const herosAvgId = this.config.data.avantages.map((a: BolAvantageModel) => a.id);
    const herosDesId = this.config.data.desavantages.map((d: BolDesavantageModel) => d.id);

    this.spinner.show();
    this.ready = false;
    this.subs = forkJoin([
      this.hs.region(regionId),
      this.hs.avantages(),
      this.hs.desavantages()
    ]).subscribe({
      next: (traits: any) => {
        this.allAvg = traits[1];
        this.allDesavg = traits[2];

        this.avantages = traits[0].avantages;
        this.desavantages = traits[0].desavantages;

        const idAvantages = this.avantages.map(avantage => avantage.id);
        const idDesavantages = this.desavantages.map(desavantage => desavantage.id);

        this.generalAvantages = traits[1].filter((avantage: BolAvantageModel) => !idAvantages.includes(avantage.id));
        this.generalDesavantages = traits[2].filter((desavantage: BolDesavantageModel) => !idDesavantages.includes(desavantage.id));

        this.selectedNatalAvantages = this.avantages.filter((avg: BolAvantageModel) => herosAvgId.includes(avg.id));
        this.selectedGeneralAvantages = this.generalAvantages.filter((avg: BolAvantageModel) => herosAvgId.includes(avg.id));

        this.selectedNatalDesavantages = this.desavantages.filter((des: BolDesavantageModel) => herosDesId.includes(des.id));
        this.selectedGeneralDesavantages = this.generalDesavantages.filter((des: BolDesavantageModel) => herosDesId.includes(des.id));


        this.checkSelection();
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
    const avg: (BolAvantageModel | undefined)[] = [];
    this.avantagesIds.forEach((id, key) => {
      avg.push(this.allAvg.find((avg) => avg.id === id));
    })
    const desa: (BolDesavantageModel | undefined)[] = [];
    this.desavantagesIds.forEach((id, key) => {
      desa.push(this.allDesavg.find((desavg) => desavg.id === id));
    })
    this.ref.close({avantages: avg, desavantages: desa, cost: this.heroismCost});
  }

  ngOnDestroy() {
    this.subs?.unsubscribe();
  }

  checkSelection() {
    const totalNatalAvantages = this.selectedNatalAvantages.length;
    const totalAvantages = totalNatalAvantages + this.selectedGeneralAvantages.length;
    const totalNatalDesavantages = this.selectedNatalDesavantages.length;
    const totalGeneralDesavantages = this.selectedGeneralDesavantages.length;
    const totalDesavantages = totalNatalDesavantages + totalGeneralDesavantages;

    let costHeroism = 0;

    // Gestion du premier avantage (natal)
    if (totalNatalAvantages === 0 && totalAvantages > 0) {
      // Si aucun avantage natal n'est sélectionné, on ne peut pas avoir d'autres avantages
      this.selectedGeneralAvantages = [];
      this.avantagesIds = [];
      this.heroismCost = 0;
      console.warn('Aucun avantage natal sélectionné, les avantages généraux ont été réinitialisés.');
      return; // On arrête ici car la sélection n'est pas valide
    }

    // Gestion du deuxième avantage (natal ou général)
    if (totalAvantages >= 2) {
      costHeroism += 1;
      if (totalNatalDesavantages >= 1) {
        // Si un désavantage natal est sélectionné, le coût en héroïsme est annulé
        costHeroism -= 1;
      }
    }

    // Gestion du troisième avantage (natal ou général)
    if (totalAvantages >= 3) {
      costHeroism += 1;
      if (totalDesavantages - totalNatalDesavantages >= 1 || totalNatalDesavantages >= 2) {
        // Si deux désavantages sont sélectionnés (généraux ou natals), le coût en héroïsme est annulé
        costHeroism -= 1;
      }
    }

    // Met à jour la liste des IDs d'avantages
    this.avantagesIds = [
      ...this.selectedNatalAvantages.map((avantage: BolAvantageModel) => avantage.id),
      ...this.selectedGeneralAvantages.map((avantage: BolAvantageModel) => avantage.id)
    ];

    // Met à jour la liste des IDs de désavantages
    this.desavantagesIds = [
      ...this.selectedNatalDesavantages.map((desavantage: BolDesavantageModel) => desavantage.id),
      ...this.selectedGeneralDesavantages.map((desavantage: BolDesavantageModel) => desavantage.id)
    ];

    // Ajuste les points d'héroïsme, s'assure qu'ils ne sont pas négatifs
    this.heroismCost = Math.max(costHeroism, 0);
  }


}
