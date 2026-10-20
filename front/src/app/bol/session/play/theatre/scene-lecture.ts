import {ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, linkedSignal, output, untracked} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BolSceneLoadResult, BolSceneModel, BolScenePiste} from '../../../models/bol-scene.model';
import {SceneActe} from '../../models/theatre.model';
import {SceneApercuMenuComponent} from './scene-apercu-menu';
import {SceneStageStore} from './scene-stage.store';

/** Les sections que le MJ peut replier. */
type SectionLecture = 'lire' | 'jeu' | 'secret' | 'pistes';

/** Une piste et l'acte de la frise vers lequel elle mène, s'il y est. */
interface PisteAffichee extends BolScenePiste {
  readonly acte: SceneActe | null;
}

/** Les notes de la scène courante, dans la colonne de droite du plateau (ou en grand dans une fenêtre) : le texte à lire aux joueurs, les
 * règles de la scène (« En jeu »), le secret du MJ et les
 * pistes, qui ouvrent l'aperçu de la scène où elles mènent. */
@Component({
  selector: 'bol-scene-lecture',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, SceneApercuMenuComponent],
  templateUrl: './scene-lecture.html',
  styleUrl: './scene-lecture.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {'[class.lec--grand]': 'grand()'},
})
export class SceneLectureComponent {
  protected readonly store = inject(SceneStageStore);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly scene = input.required<BolSceneModel>();
  readonly acts = input.required<readonly SceneActe[]>();
  /** Les notes en grand, dans leur propre fenêtre : texte plus gros, pour lire à distance et sans fatigue. */
  readonly grand = input(false);
  /** Le bouton « Agrandir » (ou « Réduire », en grand) : l'hôte ouvre ou ferme la fenêtre de lecture. */
  readonly grandToggled = output<void>();
  /** Une scène a été chargée depuis une piste, avec la session à jour : la page la pose. */
  readonly sceneChanged = output<BolSceneLoadResult>();

  /** L'id seul : une nouvelle copie de la même scène (rechargement, préparation) ne compte pas comme un changement. */
  private readonly sceneId = computed(() => this.scene().id);

  /** Les sections repliées d'un clic sur leur titre ; elles se rouvrent toutes à chaque nouvelle scène, qu'on lise son texte depuis le début. */
  private readonly repliees = linkedSignal<ReadonlySet<SectionLecture>>(() => {
    this.sceneId();
    return new Set();
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

  protected fermee(section: SectionLecture): boolean {
    return this.repliees().has(section);
  }

  protected basculer(section: SectionLecture): void {
    this.repliees.update((ensemble) => {
      const suivant = new Set(ensemble);
      if (!suivant.delete(section)) {
        suivant.add(section);
      }
      return suivant;
    });
  }
}
