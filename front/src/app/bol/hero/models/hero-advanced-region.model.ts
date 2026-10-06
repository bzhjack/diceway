import {BolRegionModel} from '../../models/bol-region.model';

export interface HeroAdvancedRegionDialogData {
  id_region?: number;
  nom?: string;
}

export interface HeroAdvancedRegionDialogResult {
  region: BolRegionModel;
  nom?: string;
}
