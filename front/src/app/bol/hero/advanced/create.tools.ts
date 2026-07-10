import {BolAvantageModel} from '../../models/bol-avantage.model';
import {BolDesavantageModel} from '../../models/bol-desavantage.model';

export type AdvancedTranslations = Record<string, string>;

const translations: AdvancedTranslations = {
  nom: 'Nom',
  joueur: 'Joueur',
  region_id: 'Region',
  vigueur: 'Vigueur',
  agilite: 'Agilite',
  esprit: 'Esprit',
  aura: 'Aura',
  initiative: 'Initiative',
  melee: 'Melee',
  tir: 'Tir',
  defense: 'Defense',
  min: 'doit etre renseigne.',
  tooSmallAttr: 'ne doit pas etre inferieur a -1.',
  tooBigAttr: 'ne doit pas etre superieur a 3.',
  required: 'ne doit pas etre vide.',
  numeric: "n'a pas une valeur correcte.",
};

export interface TraitDescriptionLine {
  readonly title: string;
  readonly description: string | null;
}

export class HeroAdvancedCreateTools {
  static translate(key: string): string {
    return translations[key] ?? key;
  }

  static avantageDescription(avantage: BolAvantageModel | null | undefined): TraitDescriptionLine[] {
    if (!avantage) {
      return [];
    }

    const lines: TraitDescriptionLine[] = [];

    if (avantage.de_bonus) {
      lines.push({title: 'De bonus', description: avantage.de_bonus_domaine});
    }
    if (avantage.attribut) {
      lines.push({
        title: 'Attribut',
        description: `${avantage.attribut}(${Number(avantage.attribut_bonus ?? 0)})`,
      });
    }
    if (avantage.description) {
      lines.push({title: 'Details', description: avantage.description});
    }

    return lines;
  }

  static desavantageDescription(
    desavantage: BolDesavantageModel | null | undefined,
  ): TraitDescriptionLine[] {
    if (!desavantage) {
      return [];
    }

    const lines: TraitDescriptionLine[] = [];

    if (desavantage.de_malus) {
      lines.push({title: 'De malus', description: desavantage.de_malus_domaine});
    }
    if (desavantage.attribut) {
      lines.push({
        title: 'Attribut',
        description: `${desavantage.attribut}(${Number(desavantage.attribut_malus ?? 0)})`,
      });
    }
    if (desavantage.description) {
      lines.push({title: 'Details', description: desavantage.description});
    }

    return lines;
  }

  static toObject<T extends {id: number | null}>(collection: readonly T[] | null | undefined): Record<number, T> {
    return (collection ?? []).reduce<Record<number, T>>((accumulator, item) => {
      if (item.id !== null) {
        accumulator[item.id] = {...accumulator[item.id], ...item};
      }
      return accumulator;
    }, {});
  }
}
