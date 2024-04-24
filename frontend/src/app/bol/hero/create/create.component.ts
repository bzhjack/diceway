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

  public idCtrl: FormControl<string | null> = new FormControl(null);
  public playerNameCtrl = new FormControl('', Validators.required);
  public heroNameCtrl = new FormControl('', Validators.required);

  public vigueurCtrl = new FormControl<number | null>(null, Validators.required);
  public agiliteCtrl = new FormControl<number | null>(null, Validators.required);
  public espritCtrl = new FormControl<number | null>(null, Validators.required);
  public auraCtrl = new FormControl<number | null>(null, Validators.required);


  heroForm = this.fb.group(
    {
      id: this.idCtrl,
      nom: this.playerNameCtrl,
      joueur: this.heroNameCtrl,
      vigueur: this.vigueurCtrl,
      agilite: this.agiliteCtrl,
      esprit: this.espritCtrl,
      aura: this.auraCtrl
    }
  );

  constructor(
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
            nom: hero.nom,
            joueur: hero.joueur,
            vigueur: hero.vigueur,
            aura: hero.aura,
            esprit: hero.esprit,
            agilite: hero.agilite
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
    const hero = this.heroForm.value;
    this.spinner.show();
    this.subs?.unsubscribe();
    if (hero.id !== null) {
      this.subs = this.hs.update(this.heroForm.value as BolHeroModel).subscribe({
        next: (hero: BolHeroModel) => {
          this.spinner.hide();
          console.log(hero);
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
}
