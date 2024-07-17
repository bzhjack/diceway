import {Component, computed, effect, inject, OnDestroy} from '@angular/core';
import {CardModule} from "primeng/card";
import {InputTextModule} from "primeng/inputtext";
import {InputNumberModule} from 'primeng/inputnumber';
import {FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
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
import {filter, forkJoin, map, Observable, Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {NgxSpinnerService} from "ngx-spinner";
import {FieldsetModule} from "primeng/fieldset";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {InlineSVGModule} from "ng-inline-svg-2";
import {MessagesModule} from "primeng/messages";
import {JsonPipe, NgForOf, NgIf, NgTemplateOutlet} from "@angular/common";
import {globalFormValidator} from "./create.validators";
import {BolMessageComponent} from "../../message/message.component";
import {BolAvantageModel} from "../../models/bol-avantage.model";
import {BolDesavantageModel} from '../../models/bol-desavantage.model';
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
import {BolHerosLanguesComponent} from "./langues/langues.component";


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
    BolHerosLanguesComponent,
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
    tap((heros: BolHerosModel) => {
      this.#herosStateService.currentHeros.set(heros);
    })
  );
  protected currentHero = toSignal<BolHerosModel>(this.valueChanges$);
  protected heroId = computed(() => this.currentHero()?.id);

  constructor(
    private spinner: NgxSpinnerService,
    private fb: FormBuilder,
    private hs: BolHerosService,
    private readonly route: ActivatedRoute) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id !== null) {
      this.getHeros(id);
    }
    effect( () => {
      const vigueur = this.currentHero()?.attributs.vigueur ?? 0;
      this.ressourcesCtrl.setValue({vitalite: 10 + vigueur, heroisme: 5 - this.#herosStateService.heroismCost()}, {emitEvent: false});
    });
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
            carrieres: hero.carrieres.map(item => { return {
              carriere_id: item.carriere_id,
              value: item.value
            }; }),
            traits: hero.traits.map(item => { return {
              id: item.id,
              traitable_id: item.traitable_id,
              type: item.type,
              detail: item.detail,
              region_id: item.region_id
            }
            })
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
}
