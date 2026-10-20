import {inject, Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {map, Observable, of, switchMap, take, tap} from 'rxjs';
import {promptDialog} from '../../shared/dw-prompt-dialog/dw-prompt-dialog';
import {BolSceneLoadResult, BolSceneModel, SceneLoadMode} from '../models/bol-scene.model';
import {BolFightSessionService} from '../services/bol-fight-session.service';
import {BolSceneService} from '../services/bol-scene.service';
import {SceneLoadDialogComponent} from './play/scene-list/scene-load-dialog';
import {SceneLoadDialogData} from './models/scene-load-dialog.model';
import {loadMessage, needsLoadChoice, normalizeTitre, SCENE_TITLE_MAX} from './play/scene-list/scene.util';

/** Les deux gestes sur les scènes qui touchent la table, partagés par l'onglet Scènes et la barre de
 * commande pour qu'ils fassent exactement la même chose : dialogues, appel réseau, message. Chaque
 * méthode émet `null` si l'utilisateur annule ; l'appelant recharge la session sur une valeur non
 * nulle et affiche l'erreur éventuelle. */
@Injectable({providedIn: 'root'})
export class SceneActionsService {
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly sceneService = inject(BolSceneService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  /** Charge une scène sur la table. Si la table porte autre chose que des héros, demande d'abord
   * « Remplacer ou Ajouter » ; sinon charge directement. */
  load(sessionId: string, scene: BolSceneModel, nonHeroCount: number): Observable<BolSceneLoadResult | null> {
    return this.chooseMode(scene, nonHeroCount).pipe(switchMap((mode) => (mode ? this.loadAs(sessionId, scene, mode) : of(null))));
  }

  /** Charge une scène sur la table dans le mode donné, sans rien demander (le plateau propose lui-même
   * « Charger la scène » ou « Ajouter ses personnages »), puis annonce le résultat — sauf si `announce` est faux :
   * le plateau l'annonce lui-même, une fois le rideau rouvert (`announceLoad`). */
  loadAs(sessionId: string, scene: BolSceneModel, mode: SceneLoadMode, announce = true): Observable<BolSceneLoadResult> {
    const load = this.fightSessionService.loadScene(sessionId, scene.id, mode);
    return announce ? load.pipe(tap((result) => this.announceLoad(scene.titre, result))) : load;
  }

  /** Annonce les personnages ignorés par un chargement de scène ; une scène chargée sans accroc se voit sur le plateau,
   * elle n'a pas besoin de message. */
  announceLoad(titre: string, result: BolSceneLoadResult): void {
    if (result.ignored <= 0) {
      return;
    }
    this.snackBar.open(loadMessage(titre, result.ignored), undefined, {duration: 4000});
  }

  /** « Enregistrer la table comme scène » : demande un titre, puis crée la scène dans le scénario
   * donné (`null` = « Sans scénario »). Elle devient la scène courante de la session. */
  saveTable(sessionId: string, scenarioId: string | null): Observable<BolSceneModel | null> {
    return promptDialog(this.dialog, {
      title: 'Enregistrer la table comme scène',
      label: 'Titre de la scène',
      maxLength: SCENE_TITLE_MAX,
      confirmLabel: 'Enregistrer',
    }).pipe(
      map((raw) => normalizeTitre(raw)),
      switchMap((titre) => {
        if (!titre) {
          return of(null);
        }
        return this.sceneService
          .create(titre, scenarioId, sessionId)
          .pipe(tap((scene) => this.snackBar.open(`Scène « ${scene.titre} » enregistrée.`, undefined, {duration: 2500})));
      }),
    );
  }

  private chooseMode(scene: BolSceneModel, nonHeroCount: number): Observable<SceneLoadMode | null> {
    if (!needsLoadChoice(nonHeroCount)) {
      return of<SceneLoadMode>('replace');
    }

    const data: SceneLoadDialogData = {titre: scene.titre, nonHeroCount};
    return this.dialog
      .open(SceneLoadDialogComponent, {data, width: '420px'})
      .afterClosed()
      .pipe(
        take(1),
        map((mode: SceneLoadMode | undefined) => mode ?? null),
      );
  }
}
