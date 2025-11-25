import {BolAvantageModel} from '../../bol-models/bol-avantage.model';
import {BolDesavantageModel} from '../../bol-models/bol-desavantage.model';


export type Translations = {
  [key: string]: string;
};

export const translations: Translations = {
  nom: "Nom",
  esprit: "Esprit",
  vigueur: "Vigueur",
  agilite: "Agilité",
  aura: "Aura",
  initiative: "Initiative",
  melee: "Mélée",
  tir: "Tir",
  region_id: "Région",
  defense: "Défense",
  min: "doit être renseigné.",
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
    let toolTip: { id: number | null, type: string, title: string, description: string | null }[] = [];
    if (avantage.de_bonus) {
      toolTip.push({id: avantage.id, type: 'A', title: 'Dé bonus', description: avantage.de_bonus_domaine});
    }
    if (avantage.attribut) {
      toolTip.push({id: avantage.id, type: 'A',title: 'Attribut', description: `${avantage.attribut}(${avantage.attribut_bonus})`});
    }
    if (avantage.description) {
      toolTip.push({id: avantage.id, type: 'A',title: 'Détails', description: avantage.description});
    }
    return toolTip;
  }

  public static desavantageDescription(desavantage: BolDesavantageModel) {
    let toolTip: { id: number | null, type: string, title: string, description: string | null }[] = [];
    if (desavantage.de_malus) {
      toolTip.push({id: desavantage.id, type: 'D', title: 'Dé malus', description: desavantage.de_malus_domaine});
    }
    if (desavantage.attribut) {
      toolTip.push({id: desavantage.id, type: 'D',title: 'Attribut', description: `${desavantage.attribut}(${desavantage.attribut_malus})`});
    }
    if (desavantage.description) {
      toolTip.push({id: desavantage.id, type: 'D', title: 'Détails', description: desavantage.description});
    }
    return toolTip;
  }

  public static toObject(collection: BolAvantageModel[] | BolDesavantageModel[]): {
    [key: number]: BolAvantageModel[] | BolDesavantageModel[]
  } {
    return collection?.reduce((acc, item) => {
      acc[item.id as number] = {...acc[item.id as number], ...item};
      return acc;
    }, {} as { [key: number]: BolAvantageModel[] | BolDesavantageModel[] });
  }
}
