import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {BolFightSessionService} from '../../services/bol-fight-session.service';

/** Ce dont le casting de la table (`ajouterParLeCasting`) a besoin pour s'ouvrir, s'enregistrer et le dire. */
export interface CastingTableOutils {
  readonly dialog: MatDialog;
  readonly fightSessionService: BolFightSessionService;
  readonly snackBar: MatSnackBar;
}
