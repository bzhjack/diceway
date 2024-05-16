import {Component, OnDestroy} from '@angular/core';
import {CardModule} from "primeng/card";
import {InputTextModule} from "primeng/inputtext";
import {InputNumberModule} from 'primeng/inputnumber';
import {
  AbstractControl,
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
import {BolHeroService} from "../../services/bol-hero.service";
import {BolHeroModel} from "../../models/bol-hero.model";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {NgxSpinnerService} from "ngx-spinner";
import {FieldsetModule} from "primeng/fieldset";
import {DialogService, DynamicDialogRef} from "primeng/dynamicdialog";
import {PictureComponent} from "../../../shared/picture/picture.component";
import {BolRegionComponent} from "./region/region.component";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {InlineSVGModule} from "ng-inline-svg-2";
import {MessagesModule} from "primeng/messages";

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
    MessagesModule
  ],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss'
})
export class BolHeroCreateComponent implements OnDestroy {
  private subs?: Subscription;
  private ref: DynamicDialogRef | undefined;


  public idCtrl: FormControl<string | null> = new FormControl(null);
  public joueurCtrl = new FormControl('', Validators.required);
  public nomCtrl = new FormControl('', Validators.required);
  public avatarCtrl: FormControl<string | null> = new FormControl(null);

  // Region
  public regionIdCtrl = new FormControl<number | null>(null);
  public regionCtrl = new FormControl<string | null>(null);

  // Attribut
  public vigueurCtrl = new FormControl<number | null>(0);
  public agiliteCtrl = new FormControl<number | null>(0);
  public espritCtrl = new FormControl<number | null>(0);
  public auraCtrl = new FormControl<number | null>(0);

  // Combat
  public initiativeCtrl = new FormControl<number | null>(0);
  public meleeCtrl = new FormControl<number | null>(0);
  public tirCtrl = new FormControl<number | null>(0);
  public defenseCtrl = new FormControl<number | null>(0);

  heroForm = this.fb.group(
    {
      id: this.idCtrl,
      joueur: this.joueurCtrl,
      nom: this.nomCtrl,
      avatar: this.avatarCtrl,

      vigueur: this.vigueurCtrl,
      agilite: this.agiliteCtrl,
      esprit: this.espritCtrl,
      aura: this.auraCtrl,

      initiative: this.initiativeCtrl,
      melee: this.meleeCtrl,
      tir: this.tirCtrl,
      defense: this.defenseCtrl,
      region_id: this.regionIdCtrl,
      region: this.regionCtrl
    }, {validators: BolHeroCreateComponent.attributValidator}
  );

  constructor(
    public ds: DialogService,
    private spinner: NgxSpinnerService,
    private fb: FormBuilder,
    private hs: BolHeroService,
    private readonly route: ActivatedRoute) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id !== null) {
      this.getHero(id);
    }
  }

  ngOnDestroy() {
    this.subs?.unsubscribe();
  }

  static attributValidator(control: AbstractControl): ValidationErrors | null {
    const controlsIds = ['vigueur', 'agilite', 'aura', 'esprit'];
    const controlsArray = controlsIds.map(id => control.get(id));
    const values = controlsArray.map(ctrl => ctrl?.value);
    console.log("values", values);
    const countNegativeOnes = values.filter(value => value === -1).length;
    if (countNegativeOnes > 1) {
      console.log('tooManyNegativeOnes');
      return { 'tooManyNegativeOnes': true };
    }
    /*const sum = values.reduce((acc, val) => acc + (val === -1 ? 0 : val), 0);
    if (sum > 4) {
      return { 'sumExceeded': true };
    }*/
    return null;

  }


  getHero(id: string) {
    this.spinner.show();
    this.subs = this.hs.one(id).subscribe({
        next: (hero: BolHeroModel) => {
          this.heroForm.patchValue({
            id: hero.id,
            joueur: hero.joueur,
            nom: hero.nom,
            avatar: hero.avatar,
            vigueur: hero.vigueur,
            aura: hero.aura,
            esprit: hero.esprit,
            agilite: hero.agilite,
            initiative: hero.initiative,
            melee: hero.melee,
            tir: hero.tir,
            defense: hero.defense,
            region_id: hero.region_id,
            region: hero.region
          });
          this.spinner.hide();
        },
        error: () => {
          this.spinner.hide();
        }
      }
    );
  }

  submit() {
    if (this.heroForm.invalid) {
      return;
    }
    const hero = this.heroForm.value;
    this.spinner.show();
    this.subs?.unsubscribe();
    if (hero.id !== null) {
      this.subs = this.hs.update(this.heroForm.value as BolHeroModel).subscribe({
        next: (hero: BolHeroModel) => {
          this.spinner.hide();
        },
        error: () => {
          this.spinner.hide();
        }
      });
    } else {
      this.subs = this.hs.create(this.heroForm.value as BolHeroModel).subscribe({
        next: (hero: BolHeroModel) => {
          this.spinner.hide();
          this.idCtrl.setValue(hero.id);
        },
        error: () => {
          this.spinner.hide();
        }
      });
    }
  }

  picture() {
    this.ref = this.ds.open(PictureComponent, { header: 'Photo du héro'});
    this.subs?.unsubscribe();
    this.subs = this.ref.onClose.subscribe((avatar: any) => {
      if (avatar !== null && avatar !== undefined) {
        this.avatarCtrl.setValue(avatar);
        this.submit();
      }
    });
  }
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
}
