import {Signal, computed} from '@angular/core';
import {BolAvantageModel} from '../../models/bol-avantage.model';
import {BolDesavantageModel} from '../../models/bol-desavantage.model';
import {traitIconType} from '../trait-icon';
import {TraitDetail, TraitEntry} from './list/trait-list.component';

/** Entrée de FormArray référençant un avantage ('A') ou un désavantage ('D'). */
export interface TraitDraft {
  id: number;
  type: 'A' | 'D';
}

export function traitSource(
  entry: TraitDraft,
  avantages: readonly BolAvantageModel[],
  desavantages: readonly BolDesavantageModel[],
): BolAvantageModel | BolDesavantageModel | undefined {
  return entry.type === 'A'
    ? avantages.find((avantage) => Number(avantage.id) === Number(entry.id))
    : desavantages.find((desavantage) => Number(desavantage.id) === Number(entry.id));
}

export function traitDetails(
  source: BolAvantageModel | BolDesavantageModel | undefined,
): readonly TraitDetail[] {
  if (!source) {
    return [];
  }

  const details: TraitDetail[] = [];
  if ('de_bonus' in source && source.de_bonus) {
    details.push({title: 'Dé bonus', description: source.de_bonus_domaine});
  }
  if ('de_malus' in source && source.de_malus) {
    details.push({title: 'Dé malus', description: source.de_malus_domaine});
  }
  if (source.attribut) {
    const attributeValue =
      'attribut_bonus' in source ? source.attribut_bonus : 'attribut_malus' in source ? source.attribut_malus : null;
    details.push({
      title: 'Attribut',
      description: `${source.attribut}${attributeValue !== null ? `(${attributeValue})` : ''}`,
    });
  }
  if (source.description) {
    details.push({title: 'Détails', description: source.description});
  }

  return details;
}

/** Projette le brouillon de traits vers des entrées d'affichage (label, détails, icône). */
export function traitEntriesSignal(
  drafts: () => readonly TraitDraft[],
  avantagesList: Signal<readonly BolAvantageModel[] | undefined>,
  desavantagesList: Signal<readonly BolDesavantageModel[] | undefined>,
): Signal<TraitEntry[]> {
  return computed(() =>
    drafts()
      .map((entry) => {
        const source = traitSource(entry, avantagesList() ?? [], desavantagesList() ?? []);
        if (!source) {
          return null;
        }

        return {
          id: Number(entry.id),
          type: entry.type,
          label: 'avantage' in source ? source.avantage : source.desavantage,
          details: traitDetails(source),
          icon: traitIconType(source),
        };
      })
      .filter((entry): entry is TraitEntry => entry !== null),
  );
}
