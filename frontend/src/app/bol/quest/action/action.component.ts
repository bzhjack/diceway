import {AfterViewInit, Component, computed, effect, inject, signal} from '@angular/core';
import {DropdownModule} from "primeng/dropdown";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {ButtonDirective} from "primeng/button";
import {FieldsetModule} from "primeng/fieldset";
import {NgForOf, NgIf} from "@angular/common";
import {CheckboxModule} from "primeng/checkbox";
import {RadioButtonModule} from "primeng/radiobutton";
import {InlineSVGModule} from "ng-inline-svg-2";
import {MenuModule} from "primeng/menu";
import {InputTextModule} from "primeng/inputtext";
import {Ripple} from "primeng/ripple";
import {InputNumberModule} from "primeng/inputnumber";
import {DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";
import {TagModule} from 'primeng/tag';
import {BolHerosModel} from "../../models/bol-heros.model";
import {DiceService} from "../../../shared/dice/dice.service";
import {BOL_DIFFICULTIES} from "../../../shared/constantes/difficulties";
import {BolAvantageModel} from "../../models/bol-avantage.model";
import {BolDesavantageModel} from "../../models/bol-desavantage.model";
import {BolDemonModel} from "../../models/bol-demon.model";
import {BolCreatureModel} from "../../models/bol-creature.model";

@Component({
    selector: 'bol-action',
  imports: [
    DropdownModule,
    FormsModule,
    FieldsetModule,
    NgForOf,
    CheckboxModule,
    RadioButtonModule,
    NgIf,
    InlineSVGModule,
    MenuModule,
    InputTextModule,
    ReactiveFormsModule,
    ButtonDirective,
    Ripple,
    InputNumberModule,
    TagModule
  ],
    templateUrl: './action.component.html',
    styleUrl: './action.component.scss'
})
export class BolActionComponent implements AfterViewInit {
  initCarriere = {carriere: 'Aucune', value: 0};
  hero = signal<BolHerosModel | BolDemonModel | null>(null);
  diceService = inject(DiceService);
  difficulties = BOL_DIFFICULTIES;
  difficulty = signal(0);
  modifier = computed(() => {
    return this.difficulty()
      + this.selectedCarriere().value
      + this.selectedAttribut().value;
  });

  diceResult = this.diceService.diceResult;
  carrieres = computed(() => {
    const carrieres = (this.hero() as BolHerosModel)?.carrieres ?? [];
    return carrieres.map(item => ({
      carriere: item.carriere?.carriere,
      value: item.value
    }));
  });
  attributs = computed(() => {
    const creature = this.hero() as unknown as BolCreatureModel;
    const attributs = (this.hero() as BolHerosModel)?.attributs ?? {
      vigueur: creature.vigueur,
      agilite: creature.agilite,
      esprit: creature.esprit,
      aura: creature.aura
    };
    return Object.entries(attributs ?? {}).map((item: [string, number]) => ({
      attr: item[0],
      value: Number(item[1])
    }));
  });
  traits = computed(() => {
    const traits = (this.hero() as BolHerosModel)?.traits ?? [];
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

  public critical: 'success' | 'failure' | null = null;
  public result: boolean | null = null;
  public parsedResult: string | null = null;

  constructor(private ref: DynamicDialogRef, private config: DynamicDialogConfig) {
    this.hero.set(config.data.hero);
    this.diceResult.set(null);
    if (config.data.attribut) {
      const attribut = this.attributs().find((attr) => attr.attr === config.data.attribut);
      if (attribut) {
        this.selectedAttribut.set(attribut);
      }
    }
    effect(() => {
      if (this.diceResult()) {
        this.checkRoll();
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.diceService.initDice('#action-dice-box'), 500);
  }

  rollDice() {
    this.result = null;
    this.critical = null;
    this.parsedResult = null;
    let notation = '2d6cs>6cf<1';
    switch (this.selectedTrait()?.type) {
      case 'A':
        notation = '3d6kh2cs>6cf<1';
        break;
      case 'D':
        notation = '3d6kl2cs>6cf<1';
        break;
    }
    if (this.modifier() !== 0) {
      notation += this.modifier() > 0 ? `+${this.modifier()}` : `${this.modifier()}`;
    }
    this.diceService.rollDice(notation, 'action');
  }

  checkRoll(ev?: Event) {
    this.result = null;
    this.critical = null;
    this.parsedResult = null;
    // Gestion du lancé manuelle
    const target = ev?.target as HTMLInputElement;
    if (target && target.value !== undefined) {
      const dice = Number(target.value);
      switch (dice) {
        case 12:
          this.result = true;
          this.critical = 'success';
          break;
        case 2:
          this.result = false;
          this.critical = 'failure';
          break;
        default:
          this.critical = null;
          this.result = (dice + this.modifier()) >= 9;
      }
      if (this.modifier() === 0) {
        this.parsedResult = `<div class="d6">${dice}</div> = <strong>${dice}</strong>`;
      } else {
        const mod = this.modifier() > 0 ? `+${this.modifier()}` : `${this.modifier()}`
        this.parsedResult = `<div class="d6">(${dice})</div> ${mod} = <strong>${dice + this.modifier()}</strong>`;
      }
    } else {
      // récupération du des rolls
      if (this.diceResult() && this.diceResult()?.result && (this.diceResult()?.result.rolls || this.diceResult()?.result.dice[0].rolls)) {
        const rolls = this.diceResult()?.result.rolls ?? this.diceResult()?.result.dice[0].rolls;
        const criticalCount = rolls.reduce((acc: any, roll: any) => {
          if (roll.critical !== null && !roll.drop) {
            // Incrémentez les valeurs de failure ou success en fonction de la valeur du critical
            acc[roll.critical] = (acc[roll.critical] || 0) + 1;
          }
          return acc;
        }, {failure: 0, success: 0});
        this.critical = criticalCount.failure === 2 ? "failure" : (criticalCount.success === 2 ? "success" : null);
      }
      this.parsedResult = this.diceResult()?.parsedResult ?? null;
      if (this.critical === 'failure') {
        this.result = false;
      } else if (this.critical === 'success') {
        this.result = true;
      } else {
        this.result = this.diceResult()?.result.value >= 9;
      }
    }
  }
}
