import {DetailDraft} from '../../shared/models/form-selection.model';

/** Modèle de brouillon du formulaire créature (distinct de {@link BolCreatureModel}, la forme persistée par l'API). */
export interface CreatureFormModel {
  id: string | null;
  nom: string;
  id_taille: number | null;
  /** Chaîne vide plutôt que `null` : `[formField]` sur `<textarea>` exige `Field<string>`. */
  commentaire: string;
  vigueur: number;
  agilite: number;
  esprit: number;
  vitalite: number;
  attaque: number;
  defense: number;
  degats: string;
  protection: string;
  avatar: string | null;
  /** Mort-vivant : sa vitalité est une force vitale, et à 0 il est détruit (04-pnj-creatures-demons.md, « Force vitale »). */
  mort_vivant: boolean;
  capacites: DetailDraft[];
}
