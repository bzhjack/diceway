import {computed, effect, inject, Injectable, signal, untracked} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {take} from 'rxjs';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {BolFightSessionModel} from '../../../models/bol-fight-session.model';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {buildPlayBoard} from '../../combat-play.util';
import {headerTitle, ignoresMessage} from '../scene-list/scene.util';
import {browserStorage, readPanelOpen, RESERVE_PANEL_KEY, writePanelOpen} from '../table-state.util';
import {TableChange} from '../../models/table-change.model';
import {applyTableChange} from '../table-change.util';
import {buildTapisCards} from '../tapis/tapis.util';
import {TapisCard} from '../../models/tapis.model';
import {SceneStageStore} from '../theatre/scene-stage.store';

/** La table d'une session : la session chargée et ce qui s'en déduit, les coulisses, la sélection. Tous les autres services de la page la lisent et y posent la session que le serveur leur renvoie. */
@Injectable()
export class TableStore {
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly stage = inject(SceneStageStore);

  readonly loading = signal(true);

  readonly errorMessage = signal<string | null>(null);

  readonly session = signal<BolFightSessionModel | null>(null);

  readonly board = computed(() => {
    const session = this.session();
    return session ? buildPlayBoard(session) : null;
  });

  /** Dérivé de `statut`. */
  readonly mode = computed<'libre' | 'combat'>(() => (this.session()?.statut === 'combat' ? 'combat' : 'libre'));

  readonly sessionId = computed(() => this.session()?.id ?? null);

  /** Page à laquelle revenir depuis un formulaire ou une bibliothèque ouverts depuis la table. */
  readonly returnUrl = computed(() => {
    const id = this.sessionId();
    return id ? `/session/${id}/play` : null;
  });

  readonly existingHeroIds = computed<ReadonlySet<string>>(
    () => new Set((this.session()?.heros ?? []).map((h) => String(h.heros_id))),
  );

  /** Coulisses (la réserve) ouvertes à droite du théâtre — fermées par défaut : la scène d'abord. */
  readonly reserveOpen = signal(readPanelOpen(browserStorage(), RESERVE_PANEL_KEY, false));

  /** Cartes de la table, une par ligne de session. */
  readonly cards = computed(() => {
    const session = this.session();
    return session ? buildTapisCards(session) : [];
  });

  /** PNJ / créatures / démons sur la table — décide si charger une scène demande « Remplacer ou Ajouter ». */
  readonly nonHeroCount = computed(() => (this.board()?.tokens ?? []).filter((t) => t.kind !== 'hero').length);

  /** Titre de la barre du haut : celui de la session en mode libre, « Scénario · Scène » en combat. */
  readonly headerTitle = computed(() => headerTitle(this.mode(), this.session()?.titre ?? null, this.session()?.scene));

  /** Cartes sélectionnées par Ctrl + clic : suppr les retire de la table. */
  readonly selectedKeys = signal<ReadonlySet<string>>(new Set());

  constructor() {
    // Chaque session chargée donne au plateau sa scène courante et ses scènes jouées.
    effect(() => {
      const session = this.session();
      if (session?.id) {
        untracked(() =>
          this.stage.sync(
            session.id!,
            session.scene_id ?? null,
            session.scenes_jouees ?? [],
            session.scenario_id ?? null,
          ),
        );
      }
    });
  }

  /** Les coulisses se sont ouvertes ou fermées d'elles-mêmes (Échap) : l'état retenu suit. */
  onCoulissesChange(open: boolean): void {
    if (open !== this.reserveOpen()) {
      this.setReserveOpen(open);
    }
  }

  setReserveOpen(open: boolean): void {
    this.reserveOpen.set(open);
    writePanelOpen(browserStorage(), RESERVE_PANEL_KEY, open);
  }

  reloadSession(): void {
    const sessionId = this.sessionId();
    if (sessionId) {
      this.loadSession(sessionId);
    }
  }

  /** Un réglage de la table vient d'être enregistré : la session suit, sans nouvelle requête. */
  onTableChanged(change: TableChange): void {
    this.session.update((session) => applyTableChange(session, change));
  }

  toggleSelected(card: TapisCard): void {
    this.selectedKeys.update((keys) => {
      const next = new Set(keys);
      if (!next.delete(card.key)) {
        next.add(card.key);
      }
      return next;
    });
  }

  notifyError(error: unknown, fallback: string): void {
    this.snackBar.open(extractApiErrorMessage(error, fallback), 'Fermer', {duration: 5000});
  }

  /** On arrive à la table : elle devient la dernière partie jouée (l'accueil la montre en tête) et, sans scène, charge la première de son
   * chapitre ; puis elle se lit, après, dans la même file d'appels : `loadSession` voit donc cette scène. */
  entrer(id: string): void {
    this.fightSessionService
      .jouer(id)
      .pipe(take(1))
      .subscribe({
        next: (session) => {
          const ignores = ignoresMessage(session.figurants_ignores);
          if (ignores) {
            this.snackBar.open(ignores, 'Fermer', {duration: 6000});
          }
        },
        error: () => undefined,
      });
    this.loadSession(id);
  }

  loadSession(id: string): void {
    this.fightSessionService
      .fightSession(id)
      .pipe(take(1))
      .subscribe({
        next: (session) => {
          this.session.set(session);
          this.loading.set(false);
        },
        error: () => {
          this.errorMessage.set('Impossible de charger cette session.');
          this.loading.set(false);
        },
      });
  }
}
