import {BolHerosModel} from '../../models/bol-heros.model';
import {ArmeDraft, ArmureDraft, IdDraft, RankedDraft} from '../../shared/models/form-selection.model';

/** Brouillon de trait dans le modèle : `id` est l'id du lien héros/trait côté serveur. */
export interface AdvancedTraitDraft {
  id: number | null;
  traitable_id: number;
  type: 'A' | 'D';
  detail: string | null;
  region_id: number | null;
  carriere: boolean;
}

/** Modèle de brouillon du formulaire héros (création avancée), distinct de {@link BolHerosModel}. */
export interface HeroAdvancedFormModel {
  id: string | null;
  user_id: string | null;
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
  foi: number;
  pouvoir: number;
  creation: number;
  experience: number;
  vilenie: number;
  armes: ArmeDraft[];
  armures: ArmureDraft[];
  langues: IdDraft[];
  carrieres: RankedDraft[];
  traits: AdvancedTraitDraft[];
}
