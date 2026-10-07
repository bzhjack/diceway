import {BolRegionModel} from '../../models/bol-region.model';

/** Données du dialogue de choix de région : la région et le nom actuels. */
export interface HeroAdvancedRegionDialogData {
  id_region?: number;
  nom?: string;
}

/** Ce que le dialogue de région renvoie : la région choisie et le nom éventuellement tiré. */
export interface HeroAdvancedRegionDialogResult {
  region: BolRegionModel;
  nom?: string;
}
