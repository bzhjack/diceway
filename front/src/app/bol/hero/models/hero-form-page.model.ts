import {BolHerosModel} from '../../models/bol-heros.model';
import {ArmeDraft, ArmureDraft, IdDraft, RankedDraft} from '../../shared/models/form-selection.model';
import {TraitDraft} from '../../shared/models/trait-entry.model';

/** Modèle de brouillon du formulaire héros (distinct de {@link BolHerosModel}, la forme persistée par l'API). */
export interface HeroFormModel {
  id: string | null;
  active: boolean;
  type: 'H';
  nom: string;
  joueur: string;
  region_id: number | null;
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
  heroisme: number;
  experience: number;
  pouvoir: number;
  foi: number;
  creation: number;
  armes: ArmeDraft[];
  armures: ArmureDraft[];
  carrieres: RankedDraft[];
  langues: IdDraft[];
  traits: TraitDraft[];
}
