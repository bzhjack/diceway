import {Component, OnDestroy} from '@angular/core';
import {CardModule} from "primeng/card";
import {InputTextModule} from "primeng/inputtext";
import {InputNumberModule} from 'primeng/inputnumber';
import {FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
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
    FieldsetModule
  ],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss'
})
export class BolHeroCreateComponent implements OnDestroy {
  private subs?: Subscription;
  private ref: DynamicDialogRef | undefined;


  public idCtrl: FormControl<string | null> = new FormControl(null);
  public playerNameCtrl = new FormControl('', Validators.required);
  public heroNameCtrl = new FormControl('', Validators.required);
  public avatarCtrl: FormControl<string | null> = new FormControl(null);
  // Attribut
  public vigueurCtrl = new FormControl<number | null>(null, Validators.required);
  public agiliteCtrl = new FormControl<number | null>(null, Validators.required);
  public espritCtrl = new FormControl<number | null>(null, Validators.required);
  public auraCtrl = new FormControl<number | null>(null, Validators.required);
  // Combat
  public initiativeCtrl = new FormControl<number | null>(null, Validators.required);
  public meleeCtrl = new FormControl<number | null>(null, Validators.required);
  public tirCtrl = new FormControl<number | null>(null, Validators.required);
  public defenseCtrl = new FormControl<number | null>(null, Validators.required);

  heroForm = this.fb.group(
    {
      id: this.idCtrl,
      joueur: this.heroNameCtrl,
      nom: this.playerNameCtrl,
      avatar: this.avatarCtrl,
      vigueur: this.vigueurCtrl,
      agilite: this.agiliteCtrl,
      esprit: this.espritCtrl,
      aura: this.auraCtrl,
      initiative: this.initiativeCtrl,
      melee: this.meleeCtrl,
      tir: this.tirCtrl,
      defense: this.defenseCtrl
    }
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
            defense: hero.defense
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
      width: '80vw',
      height: '90vh'
    });
    this.subs?.unsubscribe();
    this.subs = this.ref.onClose.subscribe((region: any) => {
      console.log(region);
    });
  }
}
