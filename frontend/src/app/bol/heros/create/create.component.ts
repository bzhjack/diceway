import {Component, computed, inject, OnDestroy} from '@angular/core';
import {CardModule} from "primeng/card";
import {InputTextModule} from "primeng/inputtext";
import {InputNumberModule} from 'primeng/inputnumber';
import {FormArray, FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {ToolbarModule} from "primeng/toolbar";
import {ButtonModule} from "primeng/button";
import {SplitButtonModule} from "primeng/splitbutton";
import {BolHerosService} from "../../services/bol-heros.service";
import {
  BolHerosAttributs,
  BolHerosCombat,
  BolHerosModel,
  BolHerosOrigines,
  BolHerosRessources
} from "../../models/bol-heros.model";
import {delay, forkJoin, map, Observable, Subscription} from "rxjs";
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
import {BolHerosCarriereModel} from "../../models/bol-carriere.model";
import {ConfirmationService} from "primeng/api";
import {ConfirmPopupModule} from "primeng/confirmpopup";
import {DropdownModule} from "primeng/dropdown";
import {Ripple} from "primeng/ripple";
import {ScrollPanelModule} from 'primeng/scrollpanel';
import {toSignal} from "@angular/core/rxjs-interop";
import {BolHerosStateService} from "../../services/bol-heros-state.service";
import {BolHerosArmureModel} from "../../models/bol-armure.model";
import {BolHerosArmeModel} from "../../models/bol-arme.model";
import {tap} from "rxjs/operators";
import {BolHerosOriginesComponent} from "./origines/origines.component";
import {BolHerosRessourcesComponent} from "./ressources/ressources.component";
import {BolHerosAttributsComponent} from "./attributs/attributs.component";
import {BolHerosCombatComponent} from "./combat/combat.component";
import {BolHerosCarrieresComponent} from "./carrieres/carrieres.component";
import {BolHerosArmuresComponent} from "./armures/armures.component";
import {BolHerosArmesComponent} from "./armes/armes.component";
import {BolHerosTraitsComponent} from "./traits/traits.component";
import {BolHerosTraitsModel} from "../../models/bol-trait.model";



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
    BolHerosOriginesComponent,
    BolHerosRessourcesComponent,
    BolHerosAttributsComponent,
    BolHerosCombatComponent,
    BolHerosCarrieresComponent,
    BolHerosArmuresComponent,
    BolHerosArmesComponent,
    BolHerosTraitsComponent,
  ],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss',
  providers: [
    ConfirmationService
  ],
})
export class BolHerosCreateComponent implements OnDestroy {
  readonly #herosStateService = inject(BolHerosStateService);
  private subs?: Subscription;
  private ref: DynamicDialogRef | undefined;

  avantages: BolAvantageModel[] = [];
  desavantages: BolDesavantageModel[] = [];



  public idCtrl: FormControl<string | null> = new FormControl(null);
  public joueurCtrl = new FormControl('', Validators.required);

  // Avantages et désavantages
  public traitsCtrl = new FormControl<BolHerosTraitsModel[]>([]);
  public armuresCtrl = new FormControl<number[]>([]);
  public armesCtrl = new FormControl<number[]>([]);
  public carrieresCtrl = new FormControl<BolHerosCarriereModel[]>([]);

  public combatCtrl = new FormControl<BolHerosCombat>({defense: 0,initiative: 0,melee: 0,tir: 0});
  public attributsCtrl = new FormControl<BolHerosAttributs>({vigueur: 0,agilite: 0,esprit: 0,aura: 0});
  public originesCtrl = new FormControl<BolHerosOrigines>({nom: null,region_id: null, avatar: null});
  public ressourcesCtrl = new FormControl<BolHerosRessources>({vitalite: 0 , heroisme: 0});

  herosForm = this.fb.group(
    {
      id: this.idCtrl,
      joueur: this.joueurCtrl,
      traits: this.traitsCtrl,
      attributs: this.attributsCtrl,
      combat: this.combatCtrl,
      armures: this.armuresCtrl,
      armes: this.armesCtrl,
      origines: this.originesCtrl,
      carrieres: this.carrieresCtrl,
      ressources: this.ressourcesCtrl
    }, {validators: globalFormValidator}
  );
  valueChanges$: Observable<BolHerosModel> = this.herosForm.valueChanges.pipe(
    map(value => ({
      id: value.id ?? null,
      joueur: value.joueur ?? '',
      ressources: {
        vitalite: value.ressources?.vitalite ?? 0,
        heroisme: value.ressources?.heroisme ?? 0,
      },
      combat: {
        initiative: value.combat?.initiative ?? 0,
        melee: value.combat?.melee ?? 0,
        tir: value.combat?.tir ?? 0,
        defense: value.combat?.defense ?? 0,
      },
      attributs: {
        vigueur: value.attributs?.vigueur ?? 0,
        aura: value.attributs?.aura ?? 0,
        esprit: value.attributs?.esprit ?? 0,
        agilite: value.attributs?.agilite ?? 0
      },
      origines: {
        avatar: value.origines?.avatar ?? null,
        nom: value.origines?.nom ?? null,
        region_id: value.origines?.region_id ?? null,
      },
      traits: value.traits ?? [],
      carrieres: value.carrieres ?? [],
      armures: value.armures ?? [],
      armes: value.armes ?? []
    })),
    tap((value) => this.#herosStateService.currentHeros.set(value))
  );
  protected currentHero = toSignal<BolHerosModel>(this.valueChanges$);
  protected heroId = computed(() => this.currentHero()?.id);

  get traits() {
    return [] as unknown as FormArray;
    //return this.herosForm.controls["traits"] as FormArray;
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
            ressources: hero.ressources,
            armures: hero.armures.map((item) => (item as BolHerosArmureModel).armure_id),
            armes: hero.armes.map(item => (item as BolHerosArmeModel).arme_id),
            combat: hero.combat,
            attributs: hero.attributs,
            origines: hero.origines,
            carrieres: hero.carrieres.map(item => { return {carriere_id: item.carriere_id, value: item.value}; }),
            traits: hero.traits.map(item => { return {trait_id: item.trait_id, type: item.type}; })
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
        id_region: this.currentHero()?.origines.region_id,
        avantages: this.avantages,
        desavantages: this.desavantages
      },
    });
    this.subs?.unsubscribe();
    this.subs = this.ref?.onClose.subscribe((data: any) => {
      if (data) {
        this.traits.clear();
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
