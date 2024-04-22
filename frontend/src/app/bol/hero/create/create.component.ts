import { Component } from '@angular/core';
import {CardModule} from "primeng/card";
import {InputTextModule} from "primeng/inputtext";
import {FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {ToolbarModule} from "primeng/toolbar";
import {ButtonModule} from "primeng/button";
import {SplitButtonModule} from "primeng/splitbutton";
import {BolHeroService} from "../../services/bol-hero.service";
import {BolHeroModel} from "../../models/bol-hero.model";

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
export class BolHeroCreateComponent {
  public playerNameCtrl = new FormControl('', Validators.required);
  public heroNameCtrl = new FormControl('', Validators.required);
  heroForm = this.fb.group(
    {
     nom: this.playerNameCtrl,
     joueur: this.heroNameCtrl,
    }
  );
  constructor( private fb: FormBuilder, private hs: BolHeroService ) {

  }
  submit() {
    console.log('ici', this.heroForm.value);
    this.hs.create(this.heroForm.value as BolHeroModel).subscribe((data) => {
      console.log(data);
    })
  }
}
