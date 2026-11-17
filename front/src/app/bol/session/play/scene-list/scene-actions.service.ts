import {inject, Injectable} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Observable} from 'rxjs';
import {BolSceneLoadResult, BolSceneModel} from '../../../models/bol-scene.model';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {loadMessage} from './scene.util';

/** Charger une scène sur la table : l'appel réseau, puis le message des personnages ignorés. L'appelant (`SceneStageStore`) recharge
 * la session et affiche l'erreur éventuelle. */
@Injectable({providedIn: 'root'})
export class SceneActionsService {
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly snackBar = inject(MatSnackBar);

  /** Charge une scène sur la table : elle remplace ce qui y est (les héros et leurs alliés restent). Le plateau annonce lui-même le
   * résultat, une fois le rideau rouvert (`announceLoad`). */
  load(sessionId: string, scene: BolSceneModel): Observable<BolSceneLoadResult> {
    return this.fightSessionService.loadScene(sessionId, scene.id, 'replace');
  }

  /** Annonce les personnages ignorés par un chargement de scène ; une scène chargée sans accroc se voit sur le plateau,
   * elle n'a pas besoin de message. */
  announceLoad(titre: string, result: BolSceneLoadResult): void {
    if (result.ignored <= 0) {
      return;
    }
    this.snackBar.open(loadMessage(titre, result.ignored), undefined, {duration: 4000});
  }
}
