import {ChangeDetectionStrategy, Component, computed, inject, input, output} from '@angular/core';
import {BolSceneLoadResult} from '../../../models/bol-scene.model';
import {TapisCard} from '../../models/tapis.model';
import {BraisesComponent} from './braises';
import {CompagnieComponent} from './compagnie';
import {SceneCartoucheComponent} from './scene-cartouche';
import {SceneDecorComponent} from './scene-decor';
import {SceneLectureComponent} from './scene-lecture';
import {SceneStageStore} from './scene-stage.store';
import {TroupeComponent} from './troupe';

/** Le mode libre de la table, mis en scène : le plateau (décor, braises, cartouche de la scène, ses notes à
 * droite, la troupe sur la rampe) et la compagnie des héros en pied. Lit la scène courante dans le store de
 * la page ; relaie à la page les gestes sur les cartes et les changements de la table. */
@Component({
  selector: 'bol-theatre',
  imports: [BraisesComponent, CompagnieComponent, SceneCartoucheComponent, SceneDecorComponent, SceneLectureComponent, TroupeComponent],
  templateUrl: './theatre.html',
  styleUrl: './theatre.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TheatreComponent {
  protected readonly store = inject(SceneStageStore);

  readonly cards = input.required<readonly TapisCard[]>();
  readonly sessionId = input.required<string>();
  readonly selectedKeys = input<ReadonlySet<string>>(new Set());
  readonly cardToggled = output<TapisCard>();
  readonly selectToggled = output<TapisCard>();
  readonly campToggleRequested = output<TapisCard>();
  /** Une scène a été chargée depuis une piste, avec la session à jour. */
  readonly sceneChanged = output<BolSceneLoadResult>();
  /** Une vitalité ou un héroïsme a été enregistré. */
  readonly changed = output<void>();
  readonly coulissesRequested = output<void>();

  protected readonly regionNom = computed(() => this.store.regionNom(this.store.displayedScene()));
}
