import {BolHerosModel} from '../../models/bol-heros.model';
import {ArmeDraft, ArmureDraft, IdDraft, RankedDraft} from '../../shared/models/form-selection.model';
import {TraitDraft} from '../../shared/models/trait-entry.model';

/** Modèle de brouillon du formulaire PNJ (distinct de {@link BolHerosModel}, la forme persistée par l'API). */
export interface PnjFormModel {
  id: string | null;
  nom: string;
  type: 'P' | 'C' | 'R';
  joueur: string;
  /** Chaîne vide plutôt que `null` : `[formField]` sur `<textarea>` exige `Field<string>`. */
  commentaire: string;
  avatar: string | null;
  vigueur: number;
  agilite: number;
  esprit: number;
  aura: number;
  initiative: number;
  melee: number;
  tir: number;
  defense: number;
  vitalite: number;
  pouvoir: number;
  foi: number;
  vilenie: number;
  creation: number;
  armes: ArmeDraft[];
  armures: ArmureDraft[];
  carrieres: RankedDraft[];
  langues: IdDraft[];
  traits: TraitDraft[];
}
