import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {BolSceneModel} from '../../../models/bol-scene.model';
import {ActeStatut} from '../../models/theatre.model';
import {SceneAmbianceComponent} from './scene-ambiance';
import {campsComptes, lieuTexte, sceneDecor} from './theatre.util';

/** Aperçu d'une scène, en tête du menu d'un acte de la frise ou d'une piste : sa vignette, son lieu, son
 * ambiance et sa distribution. Les actions (« Charger la scène »…) sont des `mat-menu-item` du menu lui-même,
 * pour rester atteignables au clavier. */
@Component({
  selector: 'bol-scene-preview',
  imports: [MatIconModule, SceneAmbianceComponent],
  template: `
    <div class="spv-vignette" aria-hidden="true">
      <img class="spv-vignette-img" [src]="vignette()" alt="" />
    </div>
    <div class="spv-corps">
      @if (lieu(); as lieu) {
        <p class="spv-lieu"><mat-icon aria-hidden="true">place</mat-icon>{{ lieu }}</p>
      }
      <h3 class="spv-titre">{{ scene().titre }}</h3>
      <bol-scene-ambiance [moment]="scene().moment" [meteo]="scene().meteo" [danger]="scene().danger" />

      @if (camps().length) {
        <p class="spv-camps">
          @for (camp of camps(); track camp.allie) {
            <span [class]="camp.allie ? 'spv-camp spv-camp--allie' : 'spv-camp spv-camp--adversaire'">{{ camp.texte }}</span>
          }
        </p>
      } @else {
        <p class="spv-note">Personne dans la distribution.</p>
      }
      @if (statut() === 'jouee') {
        <p class="spv-note">Scène déjà jouée.</p>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 20rem;
      max-width: 100%;
    }

    .spv-vignette {
      position: relative;
      aspect-ratio: 16 / 9;
      overflow: hidden;
      background: linear-gradient(#241a12, #130d08);
    }

    .spv-vignette-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: 50% 35%;
      filter: saturate(0.9) brightness(0.72);
    }

    .spv-corps {
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
      padding: 0.8rem 1rem 0.5rem;
    }

    .spv-lieu {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      margin: 0;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--dw-color-legendary);

      .mat-icon {
        width: 1rem;
        height: 1rem;
        font-size: 1rem;
      }
    }

    .spv-titre {
      margin: 0;
      font-family: 'Muse Display Harmony', serif;
      font-size: 1.35rem;
      font-weight: 400;
      line-height: 1.15;
      color: var(--dw-color-text-bright);
    }

    // Combien d'alliés et d'adversaires la scène fait entrer.
    .spv-camps {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem 0.9rem;
      margin: 0.1rem 0 0;
      font-size: 0.82rem;
      font-weight: 700;
    }

    // Les alliés en vert, les adversaires en rouge.
    .spv-camp--allie {
      color: var(--dw-color-reussite);
    }

    .spv-camp--adversaire {
      color: var(--dw-color-echec);
    }

    .spv-note {
      margin: 0;
      font-size: 0.82rem;
      color: var(--dw-surface-600);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Dans un `mat-menu`, seul un élément de menu est permis : l'aperçu en est un, désactivé (il n'agit pas), dont le texte
  // (lieu, titre, ambiance, distribution) reste lu par les lecteurs d'écran.
  host: {role: 'menuitem', 'aria-disabled': 'true', tabindex: '-1'},
})
export class ScenePreviewComponent {
  readonly scene = input.required<BolSceneModel>();
  readonly statut = input<ActeStatut | null>(null);
  readonly regionNom = input<string | null>(null);

  protected readonly lieu = computed(() => lieuTexte(this.scene().lieu, this.regionNom()));
  protected readonly camps = computed(() => campsComptes(this.scene().distribution));
  protected readonly vignette = computed(() => sceneDecor(this.scene()));
}
