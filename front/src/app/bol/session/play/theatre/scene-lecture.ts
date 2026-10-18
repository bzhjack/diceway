import {ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, linkedSignal, output, untracked} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BolSceneLoadResult, BolSceneModel, BolScenePiste} from '../../../models/bol-scene.model';
import {SceneActe} from '../../models/theatre.model';
import {SceneApercuMenuComponent} from './scene-apercu-menu';
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
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, SceneApercuMenuComponent],
  templateUrl: './scene-lecture.html',
  styleUrl: './scene-lecture.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneLectureComponent {
  protected readonly store = inject(SceneStageStore);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly scene = input.required<BolSceneModel>();
  readonly acts = input.required<readonly SceneActe[]>();
  /** Une scène a été chargée depuis une piste, avec la session à jour : la page la pose. */
  readonly sceneChanged = output<BolSceneLoadResult>();

  /** L'id seul : une nouvelle copie de la même scène (rechargement, préparation) ne compte pas comme un changement. */
  private readonly sceneId = computed(() => this.scene().id);

  /** Le secret, flouté à chaque nouvelle scène ; une copie de la même scène (après « Préparer la scène ») le laisse tel quel. */
  protected readonly secretVisible = linkedSignal(() => {
    this.sceneId();
    return false;
  });
  protected readonly pistes = computed<readonly PisteAffichee[]>(() =>
    (this.scene().pistes ?? []).map((piste) => ({
      ...piste,
      acte: piste.scene_id ? (this.acts().find((acte) => acte.scene.id === piste.scene_id) ?? null) : null,
    })),
  );

  constructor() {
    // Une nouvelle scène : la lecture repart du haut, le MJ lit son texte depuis le début.
    effect(() => {
      this.sceneId();
      untracked(() => (this.host.nativeElement.scrollTop = 0));
    });
  }

  protected toggleSecret(): void {
    this.secretVisible.update((visible) => !visible);
  }
}
