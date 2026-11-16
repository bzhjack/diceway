import {ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, linkedSignal, output, untracked, viewChild} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BolSceneLoadResult, BolSceneModel} from '../../../models/bol-scene.model';
import {TapisCard} from '../../models/tapis.model';
import {JetLance, PisteAffichee, SceneActe} from '../../models/theatre.model';
import {SceneApercuMenuComponent} from './scene-apercu-menu';
import {SceneJetsComponent} from './scene-jets';
import {SceneStageStore} from './scene-stage.store';
import {pistesAffichees} from './theatre.util';

/** Les onglets du carnet : les textes de la scène, puis ses pistes. */
type OngletLecture = 'lire' | 'jets' | 'jeu' | 'secret' | 'pistes';

/** Les notes de la scène courante, dans le carnet du MJ au milieu de la table (ou en grand dans une fenêtre), un onglet chacune : le
 * texte à lire aux joueurs, ses jets (`bol-scene-jets`, chacun se lançant pour un héros de la table), sa mise en scène (`jeu`), le secret
 * du MJ et les pistes, ces quatre-là seulement quand la scène en a. Une piste ouvre l'aperçu de la scène où elle mène, d'où on la charge. */
@Component({
  selector: 'bol-scene-lecture',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, SceneApercuMenuComponent, SceneJetsComponent],
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
  /** Les héros de la table, à qui lancer un jet de la scène ; sans eux (la lecture en grand), les jets se lisent seulement. */
  readonly heros = input<readonly TapisCard[]>([]);
  /** Un jet de la scène lancé pour un héros : la page ouvre sa carte, le panneau de jet réglé. */
  readonly jetLance = output<JetLance>();

  /** L'id seul : une nouvelle copie de la même scène (rechargement, préparation) ne compte pas comme un changement. */
  private readonly sceneId = computed(() => this.scene().id);

  protected readonly pistes = computed<readonly PisteAffichee[]>(() => pistesAffichees(this.scene(), this.acts()));

  /** Les onglets de la scène : le texte à lire toujours ; les jets, la mise en scène et le secret quand ils sont écrits, les pistes quand il
   * y en a. */
  protected readonly onglets = computed((): readonly {cle: OngletLecture; label: string}[] => {
    const scene = this.scene();
    return [
      {cle: 'lire', label: 'À lire aux joueurs'},
      ...(scene.jets?.length ? [{cle: 'jets' as const, label: 'Jets'}] : []),
      ...(scene.jeu ? [{cle: 'jeu' as const, label: 'Mise en scène'}] : []),
      ...(scene.notes ? [{cle: 'secret' as const, label: 'Secret du MJ'}] : []),
      ...(this.pistes().length ? [{cle: 'pistes' as const, label: 'Pistes'}] : []),
    ];
  });

  /** L'onglet ouvert ; chaque nouvelle scène rouvre son texte à lire, depuis le début. */
  protected readonly actif = linkedSignal<OngletLecture>(() => {
    this.sceneId();
    return 'lire';
  });

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

  protected ouvrir(onglet: OngletLecture): void {
    this.actif.set(onglet);
  }
}
