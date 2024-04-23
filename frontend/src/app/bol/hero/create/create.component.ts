import {Component, OnDestroy} from '@angular/core';
import {CardModule} from "primeng/card";
import {InputTextModule} from "primeng/inputtext";
import {FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {ToolbarModule} from "primeng/toolbar";
import {ButtonModule} from "primeng/button";
import {SplitButtonModule} from "primeng/splitbutton";
import {BolHeroService} from "../../services/bol-hero.service";
import {BolHeroModel} from "../../models/bol-hero.model";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";

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
    ReactiveFormsModule
  ],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss'
})
export class BolHeroCreateComponent implements OnDestroy {
  private subs?: Subscription;

  public idCtrl: FormControl<string | null> = new FormControl(null);
  public playerNameCtrl = new FormControl('', Validators.required);
  public heroNameCtrl = new FormControl('', Validators.required);
  heroForm = this.fb.group(
    {
      id: this.idCtrl,
      nom: this.playerNameCtrl,
      joueur: this.heroNameCtrl,
    }
  );

  constructor(private fb: FormBuilder, private hs: BolHeroService, private readonly route: ActivatedRoute) {
    const id = this.route.snapshot.paramMap.get('id');
    console.log(id);
  }
  ngOnDestroy() {
    this.subs?.unsubscribe();
  }

  submit() {
    const hero = this.heroForm.value;
    this.subs?.unsubscribe();
    if (hero.id !== null) {
      this.subs = this.hs.update(this.heroForm.value as BolHeroModel).subscribe((hero: BolHeroModel) => {
        console.log(hero);
      });
    } else {
      this.subs = this.hs.create(this.heroForm.value as BolHeroModel).subscribe((hero: BolHeroModel) => {
        this.idCtrl.setValue(hero.id)
      });
    }

  }
}
