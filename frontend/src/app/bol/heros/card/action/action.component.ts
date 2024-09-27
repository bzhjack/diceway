import {Component, computed, effect, inject, input, signal} from '@angular/core';
import {DropdownModule} from "primeng/dropdown";
import {FormsModule} from "@angular/forms";
import {BOL_DIFFICULTIES} from "../../../../shared/constantes/difficulties";
import {Button} from "primeng/button";
import {DiceService} from "../../../../shared/dice/dice.service";
import {BolHerosModel} from "../../../models/bol-heros.model";
import {FieldsetModule} from "primeng/fieldset";
import {JsonPipe, NgForOf, NgIf} from "@angular/common";
import {CheckboxModule} from "primeng/checkbox";
import {RadioButtonModule} from "primeng/radiobutton";
import {BolAvantageModel} from "../../../models/bol-avantage.model";
import {BolDesavantageModel} from "../../../models/bol-desavantage.model";
import {InlineSVGModule} from "ng-inline-svg-2";
import {MenuModule} from "primeng/menu";

@Component({
  selector: 'bol-action',
  standalone: true,
  imports: [
    DropdownModule,
    FormsModule,
    Button,
    FieldsetModule,
    NgForOf,
    CheckboxModule,
    RadioButtonModule,
    JsonPipe,
    NgIf,
    InlineSVGModule,
    MenuModule
  ],
  templateUrl: './action.component.html',
  styleUrl: './action.component.scss'
})
export class BolActionComponent {
  initCarriere = {carriere: 'Aucune', value: 0};
  hero = input<BolHerosModel | null>(null);
  diceService = inject(DiceService);
  difficulties = BOL_DIFFICULTIES;
  difficulty = signal(0);
  modifier = computed(() => {
    return this.difficulty()
      + this.selectedCarriere().value
      + this.selectedAttribut().value;
  });

  diceResult = this.diceService.diceResult;
  parsedResult = computed(() => this.diceResult()?.parsedResult);
  carrieres = computed(() => {
    return this.hero()?.carrieres.map(item => ({
      carriere: item.carriere?.carriere,
      value: item.value
    }));
  });
  attributs = computed(() => {
    return Object.entries(this.hero()?.attributs ?? {}).map((item: [string, number]) => ({
      attr: item[0],
      value: Number(item[1])
    }));
  });
  traits = computed(() => {
    const traits = this.hero()?.traits ?? [];
    const filteredTraitables = traits.filter(
      (item) => item.traitable && ((item.traitable as BolAvantageModel).de_bonus || (item.traitable as BolDesavantageModel).de_malus));

    // Récupérer les informations pertinentes
    return filteredTraitables.map((item) => ({
      id: item.id,
      type: item.type,
      trait: (item.traitable as BolAvantageModel).avantage || (item.traitable as BolDesavantageModel).desavantage,
      bonus_malus: item.traitable && 'de_bonus' in item.traitable ? "bonus" : "malus",
      domaine: (item.traitable as BolAvantageModel).de_bonus_domaine || (item.traitable as BolDesavantageModel).de_malus_domaine,
    }));
  });
  selectedTrait = signal<
    {
      id: number,
      type: 'A' | 'D',
      trait: BolAvantageModel | BolDesavantageModel,
      bonus_malus: string,
      domaine: string,
    } | null>(null);
  selectedAttribut = signal<{ attr: string, value: number }>({attr: '', value: 0});
  selectedCarriere = signal<{ carriere: string, value: number }>(this.initCarriere);

  constructor() {
    effect(() => {
      console.log(this.hero());
    });
  }


  rollDice() {
    let notation = '2d6';
    if (this.modifier() !== 0) {
      notation += this.difficulty;
    }
    this.diceService.rollDice(notation, 'action');
  }
}
