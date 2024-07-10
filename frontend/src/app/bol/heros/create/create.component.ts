import {Component, OnDestroy} from '@angular/core';
import {CardModule} from "primeng/card";
import {InputTextModule} from "primeng/inputtext";
import {InputNumberModule} from 'primeng/inputnumber';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from "@angular/forms";
import {ToolbarModule} from "primeng/toolbar";
import {ButtonModule} from "primeng/button";
import {SplitButtonModule} from "primeng/splitbutton";
import {BolHerosService} from "../../services/bol-heros.service";
import {BolHerosAttributs, BolHerosCombat, BolHerosModel} from "../../models/bol-heros.model";
import {debounceTime, forkJoin, Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {NgxSpinnerService} from "ngx-spinner";
import {FieldsetModule} from "primeng/fieldset";
import {DialogService, DynamicDialogRef} from "primeng/dynamicdialog";
import {PictureComponent} from "../../../shared/picture/picture.component";
import {BolRegionComponent} from "./region/region.component";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {InlineSVGModule} from "ng-inline-svg-2";
import {MessagesModule} from "primeng/messages";
import {JsonPipe, NgForOf, NgIf, NgTemplateOutlet} from "@angular/common";
import {attributValidator, carriereValidator, globalFormValidator} from "./create.validators";
import {BolHeroCreateTools} from './create.tools';
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
import {OverlayPanel} from "primeng/overlaypanel/overlaypanel";
import { ScrollPanelModule } from 'primeng/scrollpanel';
import {BolArmuresComponent} from "./armures/armures.component";
import {BolArmesComponent} from "./armes/armes.component";
import {BolCombatComponent} from "./combat/combat.component";
import {BolAttributsComponent} from "./attributs/attributs.component";


@Component({
  selector: 'app-create',
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
    BolAttributsComponent
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
  carriereErrors: { control: string, error: string }[] = [];

  creationWarns: { step: string, warn: string }[] = [];

  avantages: BolAvantageModel[] = [];
  desavantages: BolDesavantageModel[] = [];

  public carrieresList: BolCarriereModel[] = [];
  public selectedCarriere: BolCarriereModel | null = null;


  public idCtrl: FormControl<string | null> = new FormControl(null);
  public joueurCtrl = new FormControl('', Validators.required);
  public nomCtrl = new FormControl('', Validators.required);
  public avatarCtrl: FormControl<string | null> = new FormControl(null);

  // Region
  public regionIdCtrl = new FormControl<number | null>(null);
  public regionCtrl = new FormControl<string | null>(null);

  // Champs calculés
  public vitaliteCtrl = new FormControl<number | null>(0);
  public heroismeCtrl = new FormControl<number | null>(5);

  // Avantages et désavantages
  traitsArray = this.fb.array([]);
  heroismCostCtrl = new FormControl<number>(0);

  carrieresArray = this.fb.array([]);

  public armuresCtrl = new FormControl<number[]>([]);
  public armesCtrl = new FormControl<number[]>([]);
  public combatCtrl = new FormControl<BolHerosCombat>({defense: 0,initiative: 0,melee: 0,tir: 0});
  public attributsCtrl = new FormControl<BolHerosAttributs>({vigueur: 0,agilite: 0,esprit: 0,aura: 0});

  herosForm = this.fb.group(
    {
      id: this.idCtrl,
      joueur: this.joueurCtrl,
      nom: this.nomCtrl,
      avatar: this.avatarCtrl,
      heroisme: this.heroismeCtrl,
      vitalite: this.vitaliteCtrl,
      region_id: this.regionIdCtrl,
      region: this.regionCtrl,
      traits: this.traitsArray,
      heroism_cost: this.heroismCostCtrl,

      carrieres: this.carrieresArray,

      attributs: this.attributsCtrl,
      combat: this.combatCtrl,
      armures: this.armuresCtrl,
      armes: this.armesCtrl

    }, {validators: globalFormValidator}
  );

  get traits() {
    return this.herosForm.controls["traits"] as FormArray;
  }

  get carrieres() {
    return this.herosForm.controls["carrieres"] as FormArray;
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
    this.herosForm.events.pipe(debounceTime(200)).subscribe(() => {
      this.logFormErrors();
      this.logFormWarns();
    });
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
   * Gestion de l'afficahe des alertes
   */
  logFormWarns() {
    this.creationWarns = [];
    // Test sur l'existance d'une région
    if (!this.regionIdCtrl.value) {
      this.creationWarns.push({
        step: 'Région',
        warn: 'Vous devez choisir une région.'
      });
    }
    // Controle sur les carrières
    if (this.carriereErrors.length === 0) {
      if (this.carrieres.length != 4) {
        this.creationWarns.push({
          step: 'Carrières',
          warn: 'Vous devez choisir 4 carrières.'
        });
      }
      let sumCarriere = 0;
      for (const c of this.carrieres.controls) {
        sumCarriere += c.get('value')?.value;
      }
      if (sumCarriere < 4) {
        this.creationWarns.push({
          step: 'Aptitudes',
          warn: 'il manque ' + (4 - sumCarriere) + ' pts dans les carrières.'
        });
      }
    }

  }

  /**
   * Gestion de l'affichage des erreurs
   */

  logFormErrors(): void {
    this.carriereErrors = [];
    // Check des carrières
    this.carrieres.controls.forEach((control, index) => {
      const errors = control.get('value')?.errors;
      if (errors) {
        const idCarriere = this.carrieres.at(index).get('carriere_id')?.value;
        const carriere = this.carriereFromId(idCarriere)?.carriere;
        Object.keys(errors).forEach(keyError => {
          this.carriereErrors.push({
            control:  carriere ? carriere : '',
            error: BolHeroCreateTools.translate(keyError),
          });
        });

        console.log(`Erreurs pour carriere_id ${this.carrieres.at(index).get('carriere_id')?.value}:`, errors);
      }
    });

    // Obtenir les erreurs globales du formulaire
    const formErrors: ValidationErrors | null = this.herosForm.errors;
    // Si des erreurs globales sont présentes, les traiter
    if (formErrors != null) {
      // Itérer sur chaque erreur globale
      Object.keys(formErrors).forEach(keyError => {
        // Afficher dans la console le type d'erreur globale et la valeur de l'erreur
        if (keyError === 'carrSumExceeded') {
          this.carriereErrors.push({error: 'La somme des carrières ne doit pas dépasser 4', control: ''});
        }

        console.log(`Global error: ${keyError}, err value: `, formErrors[keyError]);
      });
    }
  }

  /**
   * Récupération du Héros (pour modification)
   * @param id
   */
  getHeros(id: string) {
    this.spinner.show();
    this.subs = forkJoin([
      this.hs.heros(id),
      this.hs.carrieres()
    ]).subscribe({
        next: (data) => {
          this.carrieresList = data[1];
          let hero: BolHerosModel = data[0];

          this.herosForm.patchValue({
            id: hero.id,
            joueur: hero.joueur,
            nom: hero.nom,
            avatar: hero.avatar,

            vitalite: hero.vitalite,
            heroisme: hero.heroisme,

            region_id: hero.region_id,
            region: hero.region,
            heroism_cost: hero.heroism_cost,
            armures: hero.armures.map(item => item.armure_id),
            armes: hero.armes.map(item => item.arme_id),
            combat: hero.combat,
            attributs: hero.attributs
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
          this.carrieres.clear();
          hero.carrieres.forEach((carriere) => this.addCarriere(carriere));
          console.log(this.herosForm.getRawValue());
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
    } else {
      this.subs = this.hs.createHeros(this.herosForm.value as unknown as BolHerosModel).subscribe({
        next: (hero: BolHerosModel) => {
          this.spinner.hide();
          this.idCtrl.setValue(hero.id);
        },
        error: () => {
          this.spinner.hide();
        }
      });
    }
  }

  /**
   * Gestion de l'avatar
   */
  picture() {
    this.ref = this.ds.open(PictureComponent, {header: 'Photo du héros'});
    this.subs?.unsubscribe();
    this.subs = this.ref.onClose.subscribe((avatar: any) => {
      if (avatar !== null && avatar !== undefined) {
        this.avatarCtrl.setValue(avatar);
        this.submit();
      }
    });
  }

  /**
   * Sélection de la région
   */
  region() {
    const currentRegionId = this.regionIdCtrl.value;
    this.ref = this.ds.open(BolRegionComponent, {
      header: 'Choix de la région',
      width: '1200px',
      height: '90vh',
      data: {
        id_region: currentRegionId
      },
    });
    this.subs?.unsubscribe();
    this.subs = this.ref?.onClose.subscribe((data: any) => {
      if (data) {
        this.regionIdCtrl.setValue(data.region.id);
        this.regionCtrl.setValue(data.region.region);
        if (data.nom) {
          this.nomCtrl.setValue(data.nom);
        }
        if (data.region.id !== currentRegionId) {
          this.traits.clear();
          this.avantages = [];
          this.desavantages = [];
        }


        this.submit();
      }
    });
  }

  clearRegion(ev: MouseEvent) {
    ev.stopPropagation();
    this.regionIdCtrl.setValue(null);
    this.regionCtrl.setValue(null);
    this.traits.clear();
    this.avantages = [];
    this.desavantages = [];
  }

  /**
   * Gestion des avantages et des désavantages
   */
  openTraits() {
    this.ref = this.ds.open(BolTraitComponent, {
      header: 'Choix des avantages pour la région ' + this.regionCtrl.value,
      width: '1200px',
      height: '90vh',
      data: {
        id_region: this.regionIdCtrl.value,
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

  /**************************************
   **************************************
   ******* Gestion des carrières ********
   **************************************
   **************************************/

  // Ajout d'une carrière
  addCarriere(carriere: BolHerosCarriereModel) {
    const carriereForm = this.fb.group({
      carriere_id: [carriere.carriere_id],
      value: [carriere.value, carriereValidator]
    });
    this.carrieres.push(carriereForm);
  }

  // Suppression d'une carriere
  removeCarriere(carriereId: number) {
    const index = this.carrieres.value.findIndex((car: BolHerosCarriereModel) => car.carriere_id === carriereId)
    if (index !== -1) this.carrieres.removeAt(index)
  }

  carriereFromId(id: number) {
    const carriere = this.carrieresList.find((itemCar) => itemCar.id === id);
    return carriere ?? {carriere: null, description: null};
  }

  createCarriere(panel: OverlayPanel, event: any) {
    panel.toggle(event);
    if (this.selectedCarriere === null) {
      return;
    }
    const heroId = this.herosForm.get('id')!.value || null;
    const carriere: BolHerosCarriereModel = {
      carriere_id: this.selectedCarriere?.id,
      value: 0
    }
    this.spinner.show();
    this.subs?.unsubscribe();
    this.subs = this.hs.createCarriere(heroId, carriere).subscribe({
      next: _ => {
        this.spinner.hide();
        this.addCarriere(carriere);
      },
      error: () => {
        this.spinner.hide();
      }
    });
  }

  deleteCarriere(carriereId: number, event: any) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Voulez vous supprimer cette carrière ?',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      acceptLabel: "Oui",
      rejectLabel: "Non",
      accept: () => {
        const heroId = this.herosForm.get('id')!.value || null;
        this.spinner.show();
        this.subs?.unsubscribe();
        this.subs = this.hs.deleteCarriere(heroId, carriereId).subscribe({
          next: _ => {
            this.spinner.hide();
            this.removeCarriere(carriereId);
          },
          error: () => {
            this.spinner.hide();
          }
        });
      },
    });
  }

  getFilteredCarrieres() {
    const carriereIdsInArray = this.carrieresArray.controls.map(control => control.get('carriere_id')?.value);
    return this.carrieresList.filter(carriere => !carriereIdsInArray.includes(carriere.id));
  }

}
