import {Component, OnDestroy} from '@angular/core';
import {Subscription} from "rxjs";
import {BolHerosService} from "../services/bol-heros.service";
import {BolHerosModel} from "../models/bol-heros.model";
import {JsonPipe, NgForOf, NgIf} from "@angular/common";
import {RouterLink} from "@angular/router";
import {NgxSpinnerService} from "ngx-spinner";
import {CardModule} from "primeng/card";
import {Button} from "primeng/button";
import {DialogModule} from "primeng/dialog";
import {InputTextModule} from "primeng/inputtext";
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from "@angular/forms";

@Component({
  selector: 'bol-home',
  standalone: true,
  imports: [
    NgForOf,
    JsonPipe,
    RouterLink,
    CardModule,
    Button,
    DialogModule,
    InputTextModule,
    ReactiveFormsModule,
    NgIf
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class BolHomeComponent implements OnDestroy {
  private subs?: Subscription;
  public heroes: Array<BolHerosModel> = [];
  public showCreate = false;
  public joueurCtrl = new FormControl('', [Validators.required,Validators.minLength(3)]);
  herosForm = this.fb.group({joueur: this.joueurCtrl});

  constructor(
    private fb: FormBuilder,
    private hs: BolHerosService,
    private spinner: NgxSpinnerService) {


    this.spinner.show();
    this.subs = this.hs.heroes().subscribe({
      next: (heroes) => {
        this.heroes = heroes;
        this.spinner.hide();
      },
      error: (error) => {
        this.spinner.hide();
      }
    });
  }

  openCreateDialog() {
    this.showCreate = true;
    this.herosForm.reset();
  }

  createHero() {
    if (this.herosForm.valid) {
      this.showCreate = false;
      const hero = this.herosForm.value;
      this.spinner.show();
      this.subs?.unsubscribe();
        this.subs = this.hs.createHeros(this.herosForm.value as BolHerosModel).subscribe({
          next: (hero: BolHerosModel) => {
            this.spinner.hide();
            console.log(hero);
            //this.idCtrl.setValue(hero.id);
          },
          error: () => {
            this.spinner.hide();
          }
        });

    }
  }
  onError(controlName: string) {
    const control = this.herosForm.get(controlName);
    return control?.dirty && control.invalid;
  }
  ngOnDestroy() {
    this.subs?.unsubscribe();
  }
}









