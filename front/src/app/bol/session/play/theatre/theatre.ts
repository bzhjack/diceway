import {ChangeDetectionStrategy, Component, computed, inject, Injector, input, output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {BolSceneLoadResult} from '../../../models/bol-scene.model';
import {TableChange} from '../../models/table-change.model';
import {TapisCard} from '../../models/tapis.model';
import {BraisesComponent} from './braises';
import {SceneCartoucheComponent} from './scene-cartouche';
import {SceneDecorComponent} from './scene-decor';
import {SceneLectureComponent} from './scene-lecture';
import {SceneLectureDialogComponent} from './scene-lecture-dialog';
import {SceneStageStore} from './scene-stage.store';
import {SituationComponent} from './situation';

/** Le mode libre de la table, côté MJ : à gauche le carnet (les notes de la scène, ses pistes) ; à droite le bandeau de la scène (décor,
 * braises, cartouche, actions) puis la feuille de situation, chaque personnage sur sa ligne (`bol-situation`). Lit la scène courante dans
 * le store de la page ; relaie à la page les gestes sur les personnages et les changements de la table. */
@Component({
  selector: 'bol-theatre',
  imports: [MatButtonModule, MatIconModule, BraisesComponent, SceneCartoucheComponent, SceneDecorComponent, SceneLectureComponent, SituationComponent],
  templateUrl: './theatre.html',
  styleUrl: './theatre.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TheatreComponent {
  protected readonly store = inject(SceneStageStore);
  private readonly dialog = inject(MatDialog);
  private readonly injector = inject(Injector);

  readonly cards = input.required<readonly TapisCard[]>();
  readonly sessionId = input.required<string>();
  readonly selectedKeys = input<ReadonlySet<string>>(new Set());
  readonly cardToggled = output<TapisCard>();
  readonly selectToggled = output<TapisCard>();
  readonly campToggleRequested = output<TapisCard>();
  /** Une scène a été chargée depuis une piste, avec la session à jour. */
  readonly sceneChanged = output<BolSceneLoadResult>();
  /** Une vitalité ou un héroïsme a été enregistré. */
  readonly changed = output<TableChange>();
  /** Les coulisses (la réserve) sont ouvertes. */
  readonly coulissesOpen = input(false);
  /** « Ajouter des personnages » : ouvre les coulisses, d'où ils entrent en scène. */
  readonly coulissesRequested = output<void>();
  /** « Démarrer un combat ». */
  readonly combatRequested = output<void>();

  protected readonly regionNom = computed(() => this.store.regionNom(this.store.displayedScene()));

  /** Ouvre les notes de la scène en grand ; une scène chargée depuis une piste y est relayée à la page. */
  protected agrandirLecture(): void {
    this.dialog
      .open<SceneLectureDialogComponent, void, BolSceneLoadResult>(SceneLectureDialogComponent, {
        // Le store de la scène est fourni par la page : la fenêtre doit le retrouver.
        injector: this.injector,
        panelClass: 'lec-dialog',
        maxWidth: '96vw',
        autoFocus: 'dialog',
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.sceneChanged.emit(result);
        }
      });
  }
}
