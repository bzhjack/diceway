import {Component, computed, effect, inject, input} from '@angular/core';
import {DropdownModule} from "primeng/dropdown";
import {FormsModule} from "@angular/forms";
import {BOL_DIFFICULTIES} from "../../../../shared/constantes/difficulties";
import {Button} from "primeng/button";
import {DiceService} from "../../../../shared/dice/dice.service";
import {BolHerosModel} from "../../../models/bol-heros.model";
import {FieldsetModule} from "primeng/fieldset";
import {NgForOf} from "@angular/common";
import {CheckboxModule} from "primeng/checkbox";

@Component({
  selector: 'bol-action',
  standalone: true,
  imports: [
    DropdownModule,
    FormsModule,
    Button,
    FieldsetModule,
    NgForOf,
    CheckboxModule
  ],
  templateUrl: './action.component.html',
  styleUrl: './action.component.scss'
})
export class BolActionComponent {
  hero = input<BolHerosModel | null>(null);
  diceService = inject(DiceService);
  difficulties = BOL_DIFFICULTIES;
  difficulty = 0;
  totalValue: number = 0;
  diceResult = this.diceService.diceResult;
  parsedResult =computed(() => this.diceResult()?.parsedResult);
  rollResult = computed(() => this.diceResult()?.result);
  carrieres = computed(() => {
    return  this.hero()?.carrieres.map(item => ({
      carriere: item.carriere?.carriere,
      value: item.value
    }));
  })
  constructor() {
    effect(() => {
      console.log(this.diceService.diceResult());
      console.log(this.hero());
    });
  }

  onCheckboxChange(event: any, careerValue: number) {
    if (event.target.checked) {
      this.totalValue += careerValue; // Ajouter la valeur à la somme
    } else {
      this.totalValue -= careerValue; // Retirer la valeur de la somme
    }
    console.log(this.totalValue);
  }


  rollDice() {
    let notation = '2d6';
    if (this.difficulty !== 0) {
      notation += this.difficulty;
    }
    this.diceService.rollDice(notation, 'action');
  }
}
