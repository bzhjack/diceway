import {ArmeDraft, ArmureDraft, IdDraft, RankedDraft} from './form-selection.model';
import {TraitDraft} from './trait-entry.model';

/** Ce que les brouillons d'un héros et d'un PNJ ont en commun : portrait, équipement, carrières, langues et traits. */
export interface CharacterFormDraft {
  avatar: string | null;
  armes: ArmeDraft[];
  armures: ArmureDraft[];
  carrieres: RankedDraft[];
  langues: IdDraft[];
  traits: TraitDraft[];
}
