import {inject, Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {concatMap, from, last} from 'rxjs';
import {confirmDialog} from '../../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {BolSceneLoadResult} from '../../../models/bol-scene.model';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {ambianceEnPhrase} from '../../../scenario/scene-form/scene-form.util';
import {sceneDecor} from '../theatre/theatre.util';
import {REMOVE_ACTION_LABEL} from '../tapis/tapis.util';
import {TapisCard} from '../../models/tapis.model';
import {SceneStageStore} from '../theatre/scene-stage.store';
import {TableStore} from './table.store';
import {ExpandedCardStore} from './expanded-card.store';
import {ajouterParLeCasting} from './casting-table';

/** Ce que le MJ commande à la table hors du tour : ajouter, retirer, changer de camp, démarrer un combat, suivre les scènes chargées. */
@Injectable()
export class TableCommandsService {
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly stage = inject(SceneStageStore);
  private readonly table = inject(TableStore);
  private readonly expanded = inject(ExpandedCardStore);
  private readonly snackBar = inject(MatSnackBar);

  /** « Ajouter un personnage » du théâtre et « + » de l'ordre d'action en combat : le casting de « Préparer la scène », vide, au bandeau
   * de la scène en cours, ses fiches du scénario d'abord, et les héros du compte qui ne sont pas encore assis ; ceux qu'il rend
   * s'asseyent à la table (nombre, camp, attitude ; un héros seul, dans la compagnie), à côté de ceux qui y sont. */
  ajouterDesPersonnages(): void {
    const sessionId = this.table.sessionId();
    if (!sessionId) {
      return;
    }
    const scene = this.stage.displayedScene();
    ajouterParLeCasting({dialog: this.dialog, fightSessionService: this.fightSessionService, snackBar: this.snackBar}, sessionId, {
      scenarioId: this.stage.sagaId(),
      sceneTitre: scene?.titre ?? this.table.session()?.titre ?? 'La table',
      sceneImage: sceneDecor(scene),
      sceneAmbiance: scene ? ambianceEnPhrase({lieu: scene.lieu ?? '', moment: scene.moment, danger: scene.danger ?? 0}) : '',
      herosAssis: (this.table.session()?.heros ?? []).map((h) => h.heros_id),
    }).subscribe((session) => this.table.session.set(session));
  }

  /** « Démarrer un combat », ou un nouveau jet de réaction en plein combat : sa page, sur tout l'écran, qui revient ici ensuite. */
  openStartCombat(reroll = false): void {
    const sessionId = this.table.session()?.id;
    if (!sessionId) {
      return;
    }
    void this.router.navigate(['/session', sessionId, 'combat'], reroll ? {queryParams: {reroll: 1}} : {});
  }

  /** Une scène vient d'être chargée depuis la frise ou une piste : la réponse porte déjà la session à jour, posée
   * telle quelle (sans second aller-retour) pour que le rideau se rouvre sur la nouvelle scène. */
  onSceneLoaded(result: BolSceneLoadResult): void {
    this.expanded.foldCard();
    this.table.session.set(result.session);
  }

  /** Suppr : retire de la table les cartes sélectionnées, après confirmation. Hors combat seulement. */
  askRemoveSelection(): void {
    const sessionId = this.table.sessionId();
    const cards = this.table.cards().filter((card) => this.table.selectedKeys().has(card.key));
    if (!sessionId || !cards.length) {
      return;
    }

    const names = cards.map((card) => `« ${card.nom} »`).join(', ');
    confirmDialog(
      this.dialog,
      {
        title: cards.length > 1 ? `Retirer ${cards.length} personnages` : REMOVE_ACTION_LABEL,
        message: `Voulez-vous retirer ${names} de la table ?`,
        confirmLabel: 'Retirer',
      },
      {width: '420px'},
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      from(cards)
        .pipe(
          concatMap((card) => this.fightSessionService.removeCombatant(sessionId, card.kind, card.pivotId)),
          last(),
        )
        .subscribe({
          next: (session) => {
            this.table.selectedKeys.set(new Set());
            this.table.session.set(session);
          },
          error: (error: unknown) => {
            this.table.loadSession(sessionId);
            this.table.notifyError(error, 'Impossible de retirer ces personnages.');
          },
        });
    });
  }

  /** Passe la carte du côté des héros (allié) ou la remet avec les présents. */
  toggleCamp(card: TapisCard): void {
    const sessionId = this.table.sessionId();
    if (!sessionId || card.kind === 'hero') {
      return;
    }

    this.fightSessionService
      .setCamp(sessionId, card.kind, card.pivotId, card.camp === 'heros' ? 'adversaires' : 'heros')
      .subscribe({
        next: (session) => this.table.session.set(session),
        error: (error: unknown) => this.table.notifyError(error, 'Impossible de changer ce personnage de camp.'),
      });
  }
}
