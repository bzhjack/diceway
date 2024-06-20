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
import {BolHerosModel} from "../../models/bol-heros.model";
import {debounceTime, Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {NgxSpinnerService} from "ngx-spinner";
import {FieldsetModule} from "primeng/fieldset";
import {DialogService, DynamicDialogRef} from "primeng/dynamicdialog";
import {PictureComponent} from "../../../shared/picture/picture.component";
import {BolRegionComponent} from "./region/region.component";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {InlineSVGModule} from "ng-inline-svg-2";
import {MessagesModule} from "primeng/messages";
import {JsonPipe, NgForOf, NgIf} from "@angular/common";
import {attributValidator, globalFormValidator} from "./create.validators";
import {BolHeroCreateTools} from './create.tools';
import {BolMessageComponent} from "../../message/message.component";
import {BolTraitComponent} from "./trait/trait.component";
import {BolAvantageModel} from "../../models/bol-avantage.model";
import {BolDesavantageModel} from '../../models/bol-desavantage.model';
import {BolTraitRowComponent} from './trait/trait-row/trait-row.component';

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
    InlineSVGModule,
    MessagesModule,
    JsonPipe,
    NgIf,
    NgForOf,
    BolMessageComponent,
    BolTraitRowComponent
  ],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss'
})
export class BolHerosCreateComponent implements OnDestroy {
  private subs?: Subscription;
  private ref: DynamicDialogRef | undefined;

  attributErrors: { control: string, error: string }[] = [];
  aptitudeErrors: { control: string, error: string }[] = [];
  creationWarns: { step: string, warn: string }[] = [];

  avantages: BolAvantageModel[] = [];
  desavantages: BolDesavantageModel[] = [];

  public idCtrl: FormControl<string | null> = new FormControl(null);
  public joueurCtrl = new FormControl('', Validators.required);
  public nomCtrl = new FormControl('', Validators.required);
  public avatarCtrl: FormControl<string | null> = new FormControl(null);

  // Region
  public regionIdCtrl = new FormControl<number | null>(null);
  public regionCtrl = new FormControl<string | null>(null);

  // Attribut
  public vigueurCtrl = new FormControl<number | null>(0, attributValidator);
  public agiliteCtrl = new FormControl<number | null>(0, attributValidator);
  public espritCtrl = new FormControl<number | null>(0, attributValidator);
  public auraCtrl = new FormControl<number | null>(0, attributValidator);


  // Combat
  public initiativeCtrl = new FormControl<number | null>(0, attributValidator);
  public meleeCtrl = new FormControl<number | null>(0, attributValidator);
  public tirCtrl = new FormControl<number | null>(0, attributValidator);
  public defenseCtrl = new FormControl<number | null>(0, attributValidator);

  // Champs calculés
  public vitaliteCtrl = new FormControl<number | null>(0);
  public heroismeCtrl = new FormControl<number | null>(5);

  // Avantages et désavantages
  traitsArray = this.fb.array([]);

  herosForm = this.fb.group(
    {
      id: this.idCtrl,
      joueur: this.joueurCtrl,
      nom: this.nomCtrl,
      avatar: this.avatarCtrl,

      heroisme: this.heroismeCtrl,
      vitalite: this.vitaliteCtrl,

      vigueur: this.vigueurCtrl,
      agilite: this.agiliteCtrl,
      esprit: this.espritCtrl,
      aura: this.auraCtrl,

      initiative: this.initiativeCtrl,
      melee: this.meleeCtrl,
      tir: this.tirCtrl,
      defense: this.defenseCtrl,


      region_id: this.regionIdCtrl,
      region: this.regionCtrl,

      traits: this.traitsArray

    }, {validators: globalFormValidator}
  );

  get traits() {
    return this.herosForm.controls["traits"] as FormArray;
  }

  constructor(
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
    this.vigueurCtrl.valueChanges.subscribe((vigueur) => {
      if (this.vigueurCtrl.valid && vigueur !== null) {
        this.vitaliteCtrl.setValue(10 + vigueur, {emitEvent: false});
      }
    })
  }

  ngOnDestroy() {
    this.subs?.unsubscribe();
  }

  /**
   * Gestion de l'afficahe des alertes
   */
  logFormWarns() {
    this.creationWarns = [];
    // Controle somme des attributs
    if (this.attributErrors.length === 0) {
      const controlsAttrIds = ['vigueur', 'agilite', 'aura', 'esprit'];
      const controlsAttrArray = controlsAttrIds.map(id => this.herosForm.get(id));
      const attrs = controlsAttrArray.map(ctrl => ctrl?.value);
      const sumAttr = attrs.reduce((acc, val) => acc + (val === -1 ? 0 : val), 0);
      if (sumAttr < 4) {
        this.creationWarns.push({step: 'Attributs', warn: 'il manque ' + (4 - sumAttr) + ' pts dans les attributs'});
      }
    }
    if (this.aptitudeErrors.length === 0) {
      const controlsAptIds = ['tir', 'melee', 'defense', 'initiative'];
      const controlsAptArray = controlsAptIds.map(id => this.herosForm.get(id));
      const apts = controlsAptArray.map(ctrl => ctrl?.value);
      const sumApt = apts.reduce((acc, val) => acc + (val === -1 ? 0 : val), 0);
      if (sumApt < 4) {
        this.creationWarns.push({
          step: 'Aptitudes',
          warn: 'il manque ' + (4 - sumApt) + ' pts dans les aptitudes de combat'
        });
      }
    }
    if (!this.regionIdCtrl.value) {
      this.creationWarns.push({
        step: 'Région',
        warn: 'Vous devez choisir une région.'
      });
    }
  }

  /**
   * Gestion de l'affichage des erreurs
   */

  logFormErrors(): void {
    this.attributErrors = [];
    this.aptitudeErrors = [];

    Object.keys(this.herosForm.controls).forEach(key => {
      const controlErrors = this.herosForm.get(key)?.errors;
      if (controlErrors != null) {
        Object.keys(controlErrors).forEach(keyError => {
          if (['vigueur', 'agilite', 'aura', 'esprit'].includes(key)) {
            this.attributErrors.push({
              control: BolHeroCreateTools.translate(key),
              error: BolHeroCreateTools.translate(keyError)
            });
          }
          if (['melee', 'tir', 'defense', 'initiative'].includes(key)) {
            this.aptitudeErrors.push({
              control: BolHeroCreateTools.translate(key),
              error: BolHeroCreateTools.translate(keyError)
            });
          }
          console.log(`Key control: ${key}, keyError: ${keyError}, error value: `, controlErrors[keyError]);
        });
      }
    });
    // Obtenir les erreurs globales du formulaire
    const formErrors: ValidationErrors | null = this.herosForm.errors;
    // Si des erreurs globales sont présentes, les traiter
    if (formErrors != null) {
      // Itérer sur chaque erreur globale
      Object.keys(formErrors).forEach(keyError => {
        // Afficher dans la console le type d'erreur globale et la valeur de l'erreur
        if (keyError === 'attrTooManyNegative') {
          this.attributErrors.push({error: 'Tu as le droit de diminuer une seule fois un attribut à -1', control: ''});
        }
        if (keyError === 'attrSumExceeded') {
          this.attributErrors.push({error: 'La somme des attributs ne doit pas dépasser 4', control: ''});
        }
        if (keyError === 'aptTooManyNegative') {
          this.aptitudeErrors.push({error: 'Tu as le droit de diminuer une seule fois une aptitude à -1', control: ''});
        }
        if (keyError === 'aptSumExceeded') {
          this.aptitudeErrors.push({error: 'La somme des aptitudes ne doit pas dépasser 4', control: ''});
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
    this.subs = this.hs.heros(id).subscribe({
        next: (hero: BolHerosModel) => {
          this.herosForm.patchValue({
            id: hero.id,
            joueur: hero.joueur,
            nom: hero.nom,
            avatar: hero.avatar,

            vitalite: hero.vitalite,
            heroisme: 5,

            vigueur: hero.vigueur,
            aura: hero.aura,
            esprit: hero.esprit,
            agilite: hero.agilite,

            initiative: hero.initiative,
            melee: hero.melee,
            tir: hero.tir,
            defense: hero.defense,

            region_id: hero.region_id,
            region: hero.region,

          });
          this.traits.clear();
          this.avantages = [];
          this.desavantages=[];
          hero.traits.forEach((trait) => {
            this.addTrait({type: trait.type, id: trait.id});
            if (trait.type === "A") {
                this.avantages.push(trait.traitable);
            } else {
              this.desavantages.push(trait.traitable);
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
      this.subs = this.hs.updateHeros(this.herosForm.value as BolHerosModel).subscribe({
        next: () => {
          this.spinner.hide();
        },
        error: () => {
          this.spinner.hide();
        }
      });
    } else {
      this.subs = this.hs.createHeros(this.herosForm.value as BolHerosModel).subscribe({
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
    this.ref = this.ds.open(BolRegionComponent, {
      header: 'Choix de la région',
      width: '95vw',
      height: '90vh',
      data: {
        id_region: this.regionIdCtrl.value
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
        this.submit();
      }
    });
  }

  clearRegion(ev: MouseEvent) {
    ev.stopPropagation();
    this.regionIdCtrl.setValue(null);
    this.regionCtrl.setValue(null);
  }

  /**
   * Gestion des avantages et des désavantages
   */
  openTraits() {
    this.ref = this.ds.open(BolTraitComponent, {
      header: 'Choix des avantages pour la région ' + this.regionCtrl.value,
      width: '95vw',
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
        console.log(data);
        this.traits.clear();
        this.avantages = data.avantages.slice();
        this.desavantages = data.desavantages.slice();
        data.avantages.forEach((avantage: BolAvantageModel) => {this.addTrait({type: 'A', id: avantage.id})});
        data.desavantages.forEach((desavantage: BolDesavantageModel) => {this.addTrait({type: 'D', id: desavantage.id})})
      }
    });
  }

  addTrait(trait: {type: 'A' | 'D', id: number | null}) {
    const traitForm = this.fb.group({
      traitable_id: [trait.id],
      type: [trait.type],
    });
    this.traits.push(traitForm);
  }
}
