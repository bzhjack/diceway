import {BolDemonModel} from '../../models/bol-demon.model';
import {DetailDraft} from '../../shared/models/form-selection.model';

/** Modèle de brouillon du formulaire démon (distinct de {@link BolDemonModel}, la forme persistée par l'API). */
export interface DemonFormModel {
  id: string | null;
  nom: string;
  id_categorie: number | null;
  /** Chaîne vide plutôt que `null` : `[formField]` sur `<textarea>` exige `Field<string>`. */
  commentaire: string;
  vigueur: number;
  agilite: number;
  esprit: number;
  aura: number;
  vitalite: number;
  melee: number;
  tir: number;
  defense: number;
  degats: string;
  avatar: string | null;
  pouvoirs: DetailDraft[];
}
