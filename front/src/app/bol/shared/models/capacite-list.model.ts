import {DwRowTone} from '../../../shared/models/dw-collapsible-row.model';
import {TraitIcon} from './trait-icon.model';

/** Une capacité à afficher dans la liste : libellé, détail, icône et ton (bonus ou malus). */
export interface CapaciteEntry {
  readonly id: number;
  readonly label: string;
  readonly description: string | null;
  readonly detail: string | null;
  readonly icon: TraitIcon;
  readonly tone: DwRowTone;
}
