import {catchError, EMPTY, filter, map, Observable, switchMap, tap} from 'rxjs';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {BolFightSessionModel} from '../../../models/bol-fight-session.model';
import {BolSceneDistributionSaisie} from '../../../models/bol-scene.model';
import {PersonnagesDialogData} from '../../../scenario/models/personnages-dialog.model';
import {openPersonnagesDialog} from '../../../scenario/scene-form/personnages-dialog/personnages-dialog';
import {CastingTableOutils} from '../../models/casting-table.model';
import {arriveeALaTable} from './table-commands.util';

/**
 * Ajouter des personnages à une table, hors combat comme en combat : le casting de « Préparer la scène », vide, au bandeau donné, avec
 * les héros du compte qui ne sont pas encore assis (`herosAssis`) ;
 * ceux qu'il rend s'asseyent (nombre, camp, attitude, `POST …/personnages`) et la table dit qui est arrivé. Émet la table à jour ;
 * rien si le MJ ferme sans choisir, ni en cas d'erreur (dite elle aussi).
 */
export function ajouterParLeCasting(
  outils: CastingTableOutils,
  sessionId: string,
  bandeau: Pick<PersonnagesDialogData, 'scenarioId' | 'sceneTitre' | 'sceneImage' | 'sceneAmbiance' | 'herosAssis'>,
): Observable<BolFightSessionModel> {
  return openPersonnagesDialog(outils.dialog, {...bandeau, cible: 'table', personnages: []}).pipe(
    filter((personnages): personnages is BolSceneDistributionSaisie[] => !!personnages?.length),
    switchMap((personnages) =>
      outils.fightSessionService.ajouterDesPersonnages(sessionId, personnages).pipe(
        tap((result) => outils.snackBar.open(arriveeALaTable(personnages, result.ignored), 'OK', {duration: 4000})),
        map((result) => result.session),
        catchError((error: unknown) => {
          outils.snackBar.open(extractApiErrorMessage(error, 'Impossible d’ajouter ces personnages.'), 'Fermer', {duration: 5000});
          return EMPTY;
        }),
      ),
    ),
  );
}
