import {Component, computed, OnDestroy} from '@angular/core';
import {CardModule} from "primeng/card";
import {InputTextModule} from "primeng/inputtext";
import {InputNumberModule} from 'primeng/inputnumber';
import {FormArray, FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {ToolbarModule} from "primeng/toolbar";
import {ButtonModule} from "primeng/button";
import {SplitButtonModule} from "primeng/splitbutton";
import {BolHerosService} from "../../services/bol-heros.service";
import {BolHerosAttributs, BolHerosCombat, BolHerosModel, BolHerosOrigines} from "../../models/bol-heros.model";
import {forkJoin, Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {NgxSpinnerService} from "ngx-spinner";
import {FieldsetModule} from "primeng/fieldset";
import {DialogService, DynamicDialogRef} from "primeng/dynamicdialog";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {InlineSVGModule} from "ng-inline-svg-2";
import {MessagesModule} from "primeng/messages";
import {JsonPipe, NgForOf, NgIf, NgTemplateOutlet} from "@angular/common";
import {globalFormValidator} from "./create.validators";
import {BolMessageComponent} from "../../message/message.component";
import {BolTraitComponent} from "./trait/trait.component";
import {BolAvantageModel} from "../../models/bol-avantage.model";
import {BolDesavantageModel} from '../../models/bol-desavantage.model';
import {BolTraitRowComponent} from './trait/trait-row/trait-row.component';
import {BolCarriereModel, BolHerosCarriereModel} from "../../models/bol-carriere.model";
import {ConfirmationService} from "primeng/api";
import {ConfirmPopupModule} from "primeng/confirmpopup";
import {DropdownModule} from "primeng/dropdown";
import {Ripple} from "primeng/ripple";
import {ScrollPanelModule} from 'primeng/scrollpanel';
import {BolArmuresComponent} from "./armures/armures.component";
import {BolArmesComponent} from "./armes/armes.component";
import {BolCombatComponent} from "./combat/combat.component";
import {BolAttributsComponent} from "./attributs/attributs.component";
import {toSignal} from "@angular/core/rxjs-interop";
import {BolOriginesComponent} from "./origines/origines.component";
import {BolCarrieresComponent} from "./carrieres/carrieres.component";


@Component({
  selector: 'bol-create-heros',
  standalone: true,
  imports: [
    CardModule,
    InputTextModule,
    FormsModule,
    ToolbarModule,
    ButtonModule,
    SplitButtonModule,
    ReactiveFormsModule,
    InputNumberModule,
    FieldsetModule,
    OverlayPanelModule,
    ScrollPanelModule,
    InlineSVGModule,
    MessagesModule,
    JsonPipe,
    NgIf,
    NgForOf,
    BolMessageComponent,
    BolTraitRowComponent,
    ConfirmPopupModule,
    DropdownModule,
    Ripple,
    NgTemplateOutlet,
    BolArmuresComponent,
    BolArmesComponent,
    BolCombatComponent,
    BolAttributsComponent,
    BolOriginesComponent,
    BolCarrieresComponent
  ],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss',
  providers: [
    ConfirmationService
  ],
})
export class BolHerosCreateComponent implements OnDestroy {
  private subs?: Subscription;
  private ref: DynamicDialogRef | undefined;

  avantages: BolAvantageModel[] = [];
  desavantages: BolDesavantageModel[] = [];



  public idCtrl: FormControl<string | null> = new FormControl(null);
  public joueurCtrl = new FormControl('', Validators.required);

  // Champs calculés
  public vitaliteCtrl = new FormControl<number | null>(0);
  public heroismeCtrl = new FormControl<number | null>(5);

  // Avantages et désavantages
  traitsArray = this.fb.array([]);
  heroismCostCtrl = new FormControl<number>(0);


  public armuresCtrl = new FormControl<number[]>([]);
  public armesCtrl = new FormControl<number[]>([]);
  public carrieresCtrl = new FormControl<BolHerosCarriereModel[]>([]);

  public combatCtrl = new FormControl<BolHerosCombat>({defense: 0,initiative: 0,melee: 0,tir: 0});
  public attributsCtrl = new FormControl<BolHerosAttributs>({vigueur: 0,agilite: 0,esprit: 0,aura: 0});
  public originesCtrl = new FormControl<BolHerosOrigines>({nom: null,region_id: null, avatar: null});

  herosForm = this.fb.group(
    {
      id: this.idCtrl,
      joueur: this.joueurCtrl,

      heroisme: this.heroismeCtrl,
      vitalite: this.vitaliteCtrl,
      traits: this.traitsArray,
      heroism_cost: this.heroismCostCtrl,
      attributs: this.attributsCtrl,
      combat: this.combatCtrl,
      armures: this.armuresCtrl,
      armes: this.armesCtrl,
      origines: this.originesCtrl,
      carrieres: this.carrieresCtrl
    }, {validators: globalFormValidator}
  );
  protected currentHero = toSignal(this.herosForm.valueChanges);
  protected heroId = computed(() => this.currentHero()?.id);

  get traits() {
    return this.herosForm.controls["traits"] as FormArray;
  }

  constructor(
    private confirmationService: ConfirmationService,
    public ds: DialogService,
    private spinner: NgxSpinnerService,
    private fb: FormBuilder,
    private hs: BolHerosService,
    private readonly route: ActivatedRoute) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id !== null) {
      this.getHeros(id);
    }
    /*this.vigueurCtrl.valueChanges.subscribe((vigueur) => {
      if (this.vigueurCtrl.valid && vigueur !== null) {
        this.vitaliteCtrl.setValue(10 + vigueur, {emitEvent: false});
      }
    })*/
  }

  ngOnDestroy() {
    this.subs?.unsubscribe();
  }
  /**
   * Récupération du Héros (pour modification)
   * @param id
   */
  getHeros(id: string) {
    this.spinner.show();
    this.subs = forkJoin([
      this.hs.heros(id),
    ]).subscribe({
        next: (data) => {
          let hero: BolHerosModel = data[0];

          this.herosForm.patchValue({
            id: hero.id,
            joueur: hero.joueur,

            vitalite: hero.vitalite,
            heroisme: hero.heroisme,

            heroism_cost: hero.heroism_cost,
            armures: hero.armures.map(item => item.armure_id),
            armes: hero.armes.map(item => item.arme_id),
            combat: hero.combat,
            attributs: hero.attributs,
            origines: hero.origines,
            carrieres: hero.carrieres.map(item => { return {carriere_id: item.carriere_id, value: item.value}; }),
          });

          this.traits.clear();
          this.avantages = [];
          this.desavantages = [];
          hero.traits.forEach((trait) => {
            this.addTrait({type: trait.type, id: trait.id, detail: trait.detail});
            if (trait.type === "A") {
              this.avantages.push({...trait.traitable, ...{pivot: {detail: trait.detail}}});
            } else {
              this.desavantages.push({...trait.traitable, ...{pivot: {detail: trait.detail}}});
            }
          });
          this.spinner.hide();
        },
        error: () => {
          this.spinner.hide();
        }
      }
    );
  }

  /**
   * Sauvegarde du héros
   */
  submit() {
    if (this.herosForm.invalid) {
      return;
    }
    const hero = this.herosForm.value;
    this.spinner.show();
    this.subs?.unsubscribe();
    if (hero.id !== null) {
      this.subs = this.hs.updateHeros(this.herosForm.value as unknown as BolHerosModel).subscribe({
        next: () => {
          this.spinner.hide();
        },
        error: () => {
          this.spinner.hide();
        }
      });
    }
  }



  /**
   * Gestion des avantages et des désavantages
   */
  openTraits() {
    this.ref = this.ds.open(BolTraitComponent, {
      header: 'Choix des avantages pour la région ',
      width: '1200px',
      height: '90vh',
      data: {
        //id_region: this.regionIdCtrl.value,
        avantages: this.avantages,
        desavantages: this.desavantages
      },
    });
    this.subs?.unsubscribe();
    this.subs = this.ref?.onClose.subscribe((data: any) => {
      if (data) {
        this.traits.clear();
        this.heroismCostCtrl.setValue(data.cost);
        this.heroismeCtrl.setValue(5 - data.cost);
        this.avantages = data.avantages.slice();
        this.desavantages = data.desavantages.slice();
        data.avantages.forEach((avantage: BolAvantageModel) => {
          this.addTrait({type: 'A', id: avantage.id, detail: avantage.pivot?.detail})
        });
        data.desavantages.forEach((desavantage: BolDesavantageModel) => {
          this.addTrait({type: 'D', id: desavantage.id, detail: desavantage.pivot?.detail})
        });
        this.subs?.unsubscribe();
        this.spinner.show();
        this.subs = this.hs.updateTraits(this.herosForm.value as unknown as BolHerosModel).subscribe(
          {
            next: (hero: BolHerosModel) => {
              this.spinner.hide();
            },
            error: () => {
              this.spinner.hide();
            }
          }
        )
      }
    });
  }

  addTrait(trait: { type: 'A' | 'D', id: number | null, detail: string | null }) {
    const traitForm = this.fb.group({
      traitable_id: [trait.id],
      type: [trait.type],
      detail: [trait.detail]
    });
    this.traits.push(traitForm);
  }

}
