import {ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, linkedSignal, output, untracked, viewChild} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BolSceneLoadResult, BolSceneModel, BolScenePiste} from '../../../models/bol-scene.model';
import {SceneActe} from '../../models/theatre.model';
import {SceneApercuMenuComponent} from './scene-apercu-menu';
import {SceneStageStore} from './scene-stage.store';

/** Les textes de la scène, un onglet chacun. */
type TexteLecture = 'lire' | 'jeu' | 'secret';

/** Une piste et l'acte de la frise vers lequel elle mène, s'il y est. */
interface PisteAffichee extends BolScenePiste {
  readonly acte: SceneActe | null;
}

/** Les notes de la scène courante, dans le carnet du MJ à gauche de la table (ou en grand dans une fenêtre) : le texte à lire aux joueurs,
 * les règles de la scène (« En jeu ») et le secret du MJ, un onglet chacun (les deux derniers seulement s'ils sont écrits) ; en bas,
 * toujours en vue, « Ensuite » : les pistes, chacune ouvrant l'aperçu de la scène où elle mène, d'où on la charge. */
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
  private readonly corps = viewChild<ElementRef<HTMLElement>>('corps');

  readonly scene = input.required<BolSceneModel>();
  readonly acts = input.required<readonly SceneActe[]>();
  /** Les notes en grand, dans leur propre fenêtre : texte plus gros, pour lire à distance et sans fatigue. */
  readonly grand = input(false);
  /** Le bouton « Agrandir » (ou la croix, en grand) : l'hôte ouvre ou ferme la fenêtre de lecture. */
  readonly grandToggled = output<void>();
  /** Une scène a été chargée depuis une piste, avec la session à jour : la page la pose. */
  readonly sceneChanged = output<BolSceneLoadResult>();

  /** L'id seul : une nouvelle copie de la même scène (rechargement, préparation) ne compte pas comme un changement. */
  private readonly sceneId = computed(() => this.scene().id);

  /** Les onglets de la scène : le texte à lire toujours, les règles et le secret quand ils sont écrits. */
  protected readonly onglets = computed((): readonly {cle: TexteLecture; label: string}[] => {
    const scene = this.scene();
    return [
      {cle: 'lire', label: 'À lire aux joueurs'},
      ...(scene.jeu ? [{cle: 'jeu' as const, label: 'En jeu'}] : []),
      ...(scene.notes ? [{cle: 'secret' as const, label: 'Secret du MJ'}] : []),
    ];
  });

  /** L'onglet ouvert ; chaque nouvelle scène rouvre son texte à lire, depuis le début. */
  protected readonly actif = linkedSignal<TexteLecture>(() => {
    this.sceneId();
    return 'lire';
  });

  protected readonly pistes = computed<readonly PisteAffichee[]>(() =>
    (this.scene().pistes ?? []).map((piste) => ({
      ...piste,
      acte: piste.scene_id ? (this.acts().find((acte) => acte.scene.id === piste.scene_id) ?? null) : null,
    })),
  );

  constructor() {
    // Une nouvelle scène, ou un autre onglet : le texte repart du haut.
    effect(() => {
      this.sceneId();
      this.actif();
      const corps = untracked(() => this.corps())?.nativeElement;
      if (corps) {
        corps.scrollTop = 0;
      }
    });
  }

  protected ouvrir(onglet: TexteLecture): void {
    this.actif.set(onglet);
  }
}
