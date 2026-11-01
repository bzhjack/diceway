import {computed, inject, Injectable, signal} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {concatMap, from, last} from 'rxjs';
import {confirmDialog} from '../../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {BolSceneLoadResult, BolSceneModel} from '../../../models/bol-scene.model';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolSceneService} from '../../../services/bol-scene.service';
import {CombatSelectionService} from '../../../services/combat-selection.service';
import {CombatantKind} from '../../../models/combat-selection.model';
import {SceneActionsService} from '../../scene-actions.service';
import {AddCombatantDialogComponent, resolveAddCombatantCamp} from '../add-combatant-dialog/add-combatant-dialog';
import {openCommandPalette} from '../command-palette/command-palette';
import {PaletteActionId, PaletteCommand, PaletteContext} from '../../models/command-palette.model';
import {reserveTab} from '../reserve/reserve.util';
import {findCard, REMOVE_ACTION_LABEL} from '../tapis/tapis.util';
import {TapisCard} from '../../models/tapis.model';
import {SceneStageStore} from '../theatre/scene-stage.store';
import {TableStore} from './table.store';
import {CombatEndService} from './combat-end.service';
import {ExpandedCardStore} from './expanded-card.store';

/** Ce que le MJ commande à la table hors du tour : ajouter, retirer, changer de camp, charger une scène, et la barre de commande, qui emprunte les mêmes chemins. */
@Injectable()
export class TableCommandsService {
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly selection = inject(CombatSelectionService);
  private readonly sceneService = inject(BolSceneService);
  private readonly sceneActions = inject(SceneActionsService);
  private readonly stage = inject(SceneStageStore);
  private readonly table = inject(TableStore);
  private readonly ending = inject(CombatEndService);
  private readonly expanded = inject(ExpandedCardStore);

  /** Scènes de l'utilisateur, chargées à chaque ouverture de la barre de commande. */
  private readonly paletteScenes = signal<readonly BolSceneModel[]>([]);

  /** État de la table vu par la barre de commande — un signal, pour que ses résultats se complètent
   * quand la bibliothèque et les scènes finissent de charger. */
  private readonly paletteContext = computed<PaletteContext>(() => ({
    mode: this.table.mode(),
    tokens: this.table.cards().map((card) => ({key: card.key, nom: card.nom, kind: card.kind})),
    catalog: this.selection.catalog(),
    heroIds: this.table.existingHeroIds(),
    scenes: this.paletteScenes(),
    reserveOpen: this.table.reserveOpen(),
  }));

  openAddCombatantDialog(): void {
    const sessionId = this.table.sessionId();
    if (!sessionId) {
      return;
    }

    this.dialog
      .open(AddCombatantDialogComponent, {
        width: 'min(760px, 94vw)',
        maxWidth: '94vw',
        maxHeight: '85vh',
        data: {
          sessionId,
          existingHeroIds: this.table.existingHeroIds(),
        },
      })
      .afterClosed()
      .subscribe((didAdd: boolean | undefined) => {
        if (didAdd) {
          this.table.loadSession(sessionId);
        }
      });
  }

  /** « Démarrer un combat », ou un nouveau jet de réaction en plein combat : sa page, sur tout l'écran, qui revient ici ensuite. */
  openStartCombat(reroll = false): void {
    const sessionId = this.table.session()?.id;
    if (!sessionId) {
      return;
    }
    void this.router.navigate(['/session', sessionId, 'combat'], reroll ? {queryParams: {reroll: 1}} : {});
  }

  /** Une scène a été chargée, enregistrée, renommée ou supprimée : la table a pu changer du tout au
   * tout, la carte dépliée est repliée avant de recharger la session. */
  onSceneChanged(): void {
    this.expanded.foldCard();
    this.table.reloadSession();
    this.stage.reload();
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

  openPalette(): void {
    if (!this.table.sessionId() || this.dialog.openDialogs.length > 0) {
      return;
    }

    // La barre s'ouvre tout de suite ; bibliothèque et scènes sont rechargées à chaque ouverture (une
    // fiche a pu être créée, renommée ou supprimée depuis) et complètent ses résultats à leur arrivée.
    this.selection.loadCatalog();
    this.sceneService.scenes().subscribe({
      next: (scenes) => this.paletteScenes.set(scenes),
      error: () => this.paletteScenes.set([]),
    });

    openCommandPalette(this.dialog, {context: this.paletteContext}).subscribe((command) => {
      if (command) {
        this.executePaletteCommand(command);
      }
    });
  }

  /** Exécute la commande choisie dans la barre, par les mêmes chemins que les panneaux. */
  private executePaletteCommand(command: PaletteCommand): void {
    const sessionId = this.table.sessionId();
    if (!sessionId) {
      return;
    }

    switch (command.type) {
      case 'select': {
        const card = findCard(this.table.cards(), command.key);
        if (card) {
          this.expanded.onCardToggled(card);
        }
        break;
      }
      case 'place':
        this.fightSessionService
          .addCombatant(sessionId, {
            kind: command.kind,
            sourceId: command.sourceId,
            camp: resolveAddCombatantCamp(command.kind, 'adversaires'),
            qty: command.qty,
          })
          .subscribe({
            next: (session) => {
              const message =
                command.qty > 1
                  ? `${command.qty} × ${command.nom} posés sur la table.`
                  : `${command.nom} posé sur la table.`;
              this.snackBar.open(message, undefined, {duration: 2000});
              this.table.session.set(session);
            },
            error: (error: unknown) => this.table.notifyError(error, 'Impossible de poser ce personnage.'),
          });
        break;
      case 'loadScene':
        this.sceneActions.load(sessionId, command.scene, this.table.nonHeroCount()).subscribe({
          next: (result) => {
            if (result) {
              this.onSceneChanged();
            }
          },
          error: (error: unknown) => this.table.notifyError(error, 'Impossible de charger la scène.'),
        });
        break;
      case 'action':
        this.runPaletteAction(command.id, sessionId);
        break;
    }
  }

  private runPaletteAction(id: PaletteActionId, sessionId: string): void {
    switch (id) {
      case 'startCombat':
        this.openStartCombat();
        break;
      case 'endCombat':
        this.ending.askEndCombat();
        break;
      case 'saveScene':
        // Rangée dans le scénario de la scène courante, sinon dans « On improvise ».
        this.sceneActions.saveTable(sessionId, this.table.session()?.scene?.scenario?.id ?? null).subscribe({
          next: (scene) => {
            if (scene) {
              this.onSceneChanged();
            }
          },
          error: (error: unknown) => this.table.notifyError(error, "Impossible d'enregistrer la scène."),
        });
        break;
      case 'toggleReserve':
        this.table.toggleReserve();
        break;
      case 'createHero':
        this.openCreateForm('hero');
        break;
      case 'createPnj':
        this.openCreateForm('pnj');
        break;
      case 'createCreature':
        this.openCreateForm('creature');
        break;
      case 'createDemon':
        this.openCreateForm('demon');
        break;
      case 'sessions':
        void this.router.navigateByUrl('/library/sessions');
        break;
      case 'newSession':
        void this.router.navigateByUrl('/session/new');
        break;
      case 'intendance':
        void this.router.navigateByUrl('/intendance');
        break;
    }
  }

  /** Formulaire de création, avec retour à cette table après enregistrement (même état de
   * navigation que les liens « Créer » de la réserve). */
  private openCreateForm(kind: CombatantKind): void {
    void this.router.navigateByUrl(reserveTab(kind).createLink, {state: {returnUrl: this.table.returnUrl()}});
  }
}
