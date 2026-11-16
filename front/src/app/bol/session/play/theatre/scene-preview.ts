import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {BolSceneModel} from '../../../models/bol-scene.model';
import {ActeStatut, PisteAffichee} from '../../models/theatre.model';
import {campsComptes, lieuTexte, METEOS, MOMENTS} from './theatre.util';

const NIVEAUX = [1, 2, 3, 4] as const;

/** Ce que dit l'en-tête de l'aperçu selon le statut de la scène. */
const STATUTS: Record<ActeStatut, string> = {jouee: 'Déjà jouée', 'en-cours': 'En cours', 'a-venir': 'À venir'};

/**
 * Aperçu d'une scène, en tête du menu d'un acte de la frise ou d'une piste, comme une fiche : en tête son numéro (dans un rond à la
 * couleur de son statut), son titre, son statut et sa place dans le chapitre ; puis une ligne par information, son icône et son libellé
 * alignés : le lieu, l'ambiance, le danger, le nombre d'adversaires et d'alliés, les scènes où mènent ses pistes. Une ligne sans valeur est tue. Les actions (« Charger la scène »…) sont des `mat-menu-item` du menu
 * lui-même, pour rester atteignables au clavier.
 */
@Component({
  selector: 'bol-scene-preview',
  imports: [MatIconModule],
  template: `
    <div class="spv-tete">
      <span [class]="'spv-numero spv-numero--' + statutCle()" aria-hidden="true">{{ numero() ?? '·' }}</span>
      <div class="spv-tete-texte">
        <h3 class="spv-titre">{{ scene().titre }}</h3>
        <p [class]="'spv-statut spv-statut--' + statutCle()">
          @if (statut() === 'jouee') {
            <mat-icon aria-hidden="true">check</mat-icon>
          }
          {{ statutTexte() }}
          @if (numero() && total()) {
            <span class="spv-rang">· scène {{ numero() }} sur {{ total() }}</span>
          }
        </p>
      </div>
    </div>

    <div class="spv-lignes">
      @if (lieu(); as lieu) {
        <div class="spv-ligne">
          <mat-icon class="spv-icone spv-icone--lieu" aria-hidden="true">place</mat-icon>
          <span class="spv-libelle">Lieu</span>
          <span class="spv-valeur">{{ lieu }}</span>
        </div>
      }
      @if (ambiance(); as ambiance) {
        <div class="spv-ligne">
          <mat-icon class="spv-icone" aria-hidden="true">{{ ambiance.icone }}</mat-icon>
          <span class="spv-libelle">Ambiance</span>
          <span class="spv-valeur">{{ ambiance.texte }}</span>
        </div>
      }
      @if (scene().danger; as niveau) {
        <div class="spv-ligne">
          <mat-icon class="spv-icone spv-icone--danger" svgIcon="skull" aria-hidden="true" />
          <span class="spv-libelle">Danger</span>
          <span class="spv-valeur spv-cranes" role="img" [attr.aria-label]="niveau + ' sur 4'">
            @for (n of niveaux; track n) {
              <mat-icon svgIcon="skull" aria-hidden="true" [class.spv-crane--on]="n <= niveau" />
            }
          </span>
        </div>
      }
      @for (camp of camps(); track camp.allie) {
        <div class="spv-ligne">
          <mat-icon [class]="'spv-icone ' + (camp.allie ? 'spv-icone--allie' : 'spv-icone--adversaire')" aria-hidden="true">groups</mat-icon>
          <span class="spv-libelle">{{ camp.allie ? 'Alliés' : 'En face' }}</span>
          <span class="spv-valeur">
            <b [class]="camp.allie ? 'spv-compte spv-compte--allie' : 'spv-compte spv-compte--adversaire'">{{ camp.texte }}</b>
          </span>
        </div>
      } @empty {
        <div class="spv-ligne">
          <mat-icon class="spv-icone" aria-hidden="true">groups</mat-icon>
          <span class="spv-libelle">En scène</span>
          <span class="spv-valeur spv-vide">Personne dans la distribution</span>
        </div>
      }
      @if (suites().length) {
        <div class="spv-ligne">
          <mat-icon class="spv-icone" aria-hidden="true">east</mat-icon>
          <span class="spv-libelle">Ensuite</span>
          <span class="spv-valeur">
            @for (piste of suites(); track $index) {
              <span class="spv-suite">{{ piste.acte ? piste.acte.numero + ' · ' + piste.acte.scene.titre : piste.texte }}</span>
            }
          </span>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      max-width: 100%;
    }

    // En tête : le numéro dans un rond à la couleur du statut, le titre, le statut et la place dans le chapitre.
    .spv-tete {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem 1rem 0.75rem;
      border-bottom: 1px solid var(--dw-forge-bronze-edge);
    }

    .spv-numero {
      flex: none;
      display: grid;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      border: 1px solid var(--spv-statut);
      border-radius: 50%;
      background: color-mix(in srgb, var(--spv-statut) 18%, transparent);
      color: color-mix(in srgb, var(--spv-statut) 45%, white);
      font-family: 'Muse Display Harmony', serif;
      font-size: 1.25rem;
    }

    .spv-numero--jouee,
    .spv-statut--jouee {
      --spv-statut: var(--dw-color-reussite);
    }

    .spv-numero--en-cours,
    .spv-statut--en-cours {
      --spv-statut: var(--dw-color-legendary);
    }

    .spv-numero--a-venir,
    .spv-statut--a-venir {
      --spv-statut: var(--dw-forge-bronze);
    }

    .spv-tete-texte {
      min-width: 0;
    }

    .spv-titre {
      margin: 0;
      font-family: 'Muse Display Harmony', serif;
      font-size: 1.3rem;
      font-weight: 400;
      line-height: 1.1;
      color: var(--dw-color-text-bright);
    }

    .spv-statut {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      margin: 0.25rem 0 0;
      font-size: 0.75rem;
      font-weight: 600;
      color: color-mix(in srgb, var(--spv-statut) 55%, white);

      .mat-icon {
        width: 0.9rem;
        height: 0.9rem;
        font-size: 0.9rem;
      }
    }

    .spv-rang {
      font-weight: 400;
      color: var(--dw-forge-caption);
    }

    // Une ligne par information : l'icône, le libellé en petites capitales, la valeur.
    .spv-lignes {
      display: flex;
      flex-direction: column;
      padding: 0.35rem 1rem 0.6rem;
    }

    .spv-ligne {
      display: grid;
      grid-template-columns: 1.25rem 5rem minmax(0, 1fr);
      align-items: start;
      gap: 0.5rem;
      padding: 0.4rem 0;
      font-size: 0.82rem;
      line-height: 1.35;
      color: var(--dw-color-text-bright);
    }

    .spv-icone {
      width: 1.05rem;
      height: 1.05rem;
      font-size: 1.05rem;
      color: var(--dw-forge-name);
    }

    .spv-icone--lieu {
      color: var(--dw-color-legendary);
    }

    .spv-icone--danger,
    .spv-icone--adversaire {
      color: var(--dw-color-echec);
    }

    .spv-icone--allie {
      color: var(--dw-color-reussite);
    }

    .spv-libelle {
      padding-top: 0.1rem;
      font-size: 0.66rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--dw-forge-caption);
    }

    .spv-valeur {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      min-width: 0;
    }

    // Une scène d'« Ensuite » par ligne : le panneau s'élargit pour elle ; au-delà de sa largeur maximale, elle finit en « … ».
    .spv-suite {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .spv-cranes {
      flex-direction: row;
      gap: 0.1rem;

      .mat-icon {
        width: 0.95rem;
        height: 0.95rem;
        color: var(--dw-forge-bronze-dim);
      }

      .spv-crane--on {
        color: var(--dw-color-echec);
      }
    }

    .spv-compte {
      font-weight: 700;
    }

    .spv-compte--adversaire {
      color: color-mix(in srgb, var(--dw-color-echec) 55%, white);
    }

    .spv-compte--allie {
      color: color-mix(in srgb, var(--dw-color-reussite) 55%, white);
    }

    .spv-vide {
      color: var(--dw-forge-caption);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Dans un `mat-menu`, seul un élément de menu est permis : l'aperçu en est un, désactivé (il n'agit pas), dont le texte
  // (titre, statut, lieu, ambiance, danger, camps, suites) reste lu par les lecteurs d'écran.
  host: {role: 'menuitem', 'aria-disabled': 'true', tabindex: '-1'},
})
export class ScenePreviewComponent {
  readonly scene = input.required<BolSceneModel>();
  readonly statut = input<ActeStatut | null>(null);
  readonly regionNom = input<string | null>(null);
  /** Le numéro de la scène dans le chapitre, et le nombre de scènes du chapitre. */
  readonly numero = input<number | null>(null);
  readonly total = input<number | null>(null);
  /** Les pistes de la scène, chacune avec l'acte où elle mène. */
  readonly suites = input<readonly PisteAffichee[]>([]);

  protected readonly niveaux = NIVEAUX;
  protected readonly statutCle = computed(() => this.statut() ?? 'a-venir');
  protected readonly statutTexte = computed(() => STATUTS[this.statutCle()]);
  protected readonly lieu = computed(() => lieuTexte(this.scene().lieu, this.regionNom()));
  /** Le moment et le temps, en clair (« Nuit · Brume »), avec l'icône du premier connu ; null sans l'un ni l'autre. */
  protected readonly ambiance = computed(() => {
    const options = [MOMENTS.find((m) => m.value === this.scene().moment), METEOS.find((m) => m.value === this.scene().meteo)].filter(
      (option) => option !== undefined,
    );
    return options.length ? {icone: options[0].icon, texte: options.map((option) => option.label).join(' · ')} : null;
  });
  /** Ceux d'en face d'abord, puis les alliés. */
  protected readonly camps = computed(() => [...campsComptes(this.scene().distribution)].reverse());
}
