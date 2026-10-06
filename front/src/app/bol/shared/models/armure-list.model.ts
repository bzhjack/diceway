import {BolArmureCategorie} from '../../models/bol-armure.model';

export interface ArmureEntry {
  readonly id: number;
  readonly label: string;
  readonly protection: string | null;
  readonly malus: string | null;
  readonly ptsDePouvoir: string | null;
  readonly categorie: BolArmureCategorie;
  readonly equipee: boolean;
  readonly malusAgilite: number;
  readonly malusInitiative: number;
}
