import {ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {BolSceneLoadResult, BolSceneModel, BolScenePiste, SceneLoadMode} from '../../../models/bol-scene.model';
import {SceneActe} from '../../models/theatre.model';
import {openSceneEditor} from './scene-editor-dialog/scene-editor-dialog';
import {ScenePreviewComponent} from './scene-preview';
import {SceneStageStore} from './scene-stage.store';

/** Une piste et l'acte de la frise vers lequel elle mène, s'il y est. */
interface PisteAffichee extends BolScenePiste {
  readonly acte: SceneActe | null;
}

/** Les notes de la scène courante, dans la colonne de droite du plateau : le texte à lire aux joueurs, le
 * secret du MJ (flouté tant qu'on ne l'affiche pas, flouté de nouveau à chaque changement de scène) et les
 * pistes, qui ouvrent l'aperçu de la scène où elles mènent. */
@Component({
  selector: 'bol-scene-lecture',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, ScenePreviewComponent],
  templateUrl: './scene-lecture.html',
  styleUrl: './scene-lecture.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneLectureComponent {
  protected readonly store = inject(SceneStageStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly scene = input.required<BolSceneModel>();
  readonly acts = input.required<readonly SceneActe[]>();
  /** Une scène a été chargée depuis une piste, avec la session à jour : la page la pose. */
  readonly sceneChanged = output<BolSceneLoadResult>();

  protected readonly secretVisible = linkedSignal(() => {
    this.scene().id;
    return false;
  });
  protected readonly pistes = computed<readonly PisteAffichee[]>(() =>
    (this.scene().pistes ?? []).map((piste) => ({
      ...piste,
      acte: piste.scene_id ? (this.acts().find((acte) => acte.scene.id === piste.scene_id) ?? null) : null,
    })),
  );

  protected toggleSecret(): void {
    this.secretVisible.update((visible) => !visible);
  }

  protected regionNom(scene: BolSceneModel): string | null {
    return scene.region_id != null ? (this.store.regionNoms().get(scene.region_id) ?? null) : null;
  }

  protected load(scene: BolSceneModel, mode: SceneLoadMode): void {
    this.store.load(scene, mode).subscribe({
      next: (result) => {
        if (result) {
          this.sceneChanged.emit(result);
        }
      },
      error: (error: unknown) => this.snackBar.open(extractApiErrorMessage(error, 'Impossible de charger la scène.'), 'Fermer', {duration: 5000}),
    });
  }

  /** « Préparer la scène » : la scène affichée par défaut, ou celle d'une piste. Ses pistes mènent aux scènes de son
   * propre scénario, pas forcément celui de la frise. */
  protected edit(scene: BolSceneModel = this.scene()): void {
    openSceneEditor(this.dialog, {scene, siblings: this.store.siblingsOf(scene)}).subscribe((updated) => {
      if (updated) {
        this.store.replaceScene(updated);
      }
    });
  }
}
