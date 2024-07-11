import {BolAvantageModel} from "../../models/bol-avantage.model";
import {BolDesavantageModel} from "../../models/bol-desavantage.model";

export type Translations = {
    [key: string]: string;
};

export const translations: Translations = {
    nom: "Nom",
    esprit: "Esprit",
    vigueur: "Vigueur",
    agilite: "Agilité",
    aura: "Aura",
    initiative:"Initiative",
    melee: "Mélée",
    tir: "Tir",
    defense: "Défense",
    tooSmallAttr: "ne doit pas être inférieur à -1.",
    tooBigAttr: "ne doit pas être supérieur à 3.",
    required: "ne doit pas être vide.",
    numeric: "n'a pas une valeur correcte."
};
export class BolHeroCreateTools {

    public static translate(key: string): string {
        if (translations[key]) {
            return translations[key];
        }
        return `Translation not found for key: "${key}"`;
    }
  public static avantageDescription(avantage: BolAvantageModel) {
    let toolTip: { title: string, description: string | null }[] = [];
    if (avantage.de_bonus) {
      toolTip.push({title: 'Dé bonus', description: avantage.de_bonus_domaine});
    }
    if (avantage.attribut) {
      toolTip.push({title: 'Attribut', description: `${avantage.attribut}(${avantage.attribut_bonus})`});
    }
    if (avantage.description) {
      toolTip.push({title: 'Détails', description: avantage.description});
    }
    return toolTip;
  }

  public static desavantageDescription(desavantage: BolDesavantageModel) {
    let toolTip: { title: string, description: string | null }[] = [];
    if (desavantage.de_malus) {
      toolTip.push({title: 'Dé malus', description: desavantage.de_malus_domaine});
    }
    if (desavantage.attribut) {
      toolTip.push({title: 'Attribut', description: `${desavantage.attribut}(${desavantage.attribut_malus})`});
    }
    if (desavantage.description) {
      toolTip.push({title: 'Détails', description: desavantage.description});
    }
    return toolTip;
  }
}
