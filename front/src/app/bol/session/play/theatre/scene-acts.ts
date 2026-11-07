import {afterRenderEffect, ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, output, viewChild} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {BolSceneLoadResult} from '../../../models/bol-scene.model';
import {CombatSelectionService} from '../../../services/combat-selection.service';
import {SceneActe} from '../../models/theatre.model';
import {DwScrollerComponent} from '../../../../shared/dw-scroller/dw-scroller';
import {SceneApercuMenuComponent} from './scene-apercu-menu';
import {SceneStageStore} from './scene-stage.store';
import {acteLabel} from './theatre.util';

/** Le titre et la frise des actes, dans l'en-tête de la table : la session en sur-titre, le scénario de la table (choisi à
 * l'accueil, affiché en texte) et ses scènes en pastilles numérotées reliées par un filet. Une pastille ouvre le menu d'aperçu
 * de la scène (`bol-scene-apercu-menu`). Signale à la page (`sceneChanged`) chaque scène chargée. */
@Component({
  selector: 'bol-scene-acts',
  imports: [DwScrollerComponent, MatIconModule, MatMenuModule, SceneApercuMenuComponent],
  template: `
    <div class="sca-titre">
      <span class="sca-sur">{{ sessionTitre() || 'Table' }}</span>
      <h1 class="sca-h1" [attr.title]="scenarioTitre()">
        <span class="sca-scenario-titre">{{ scenarioTitre() }}</span>
      </h1>
    </div>

    <nav #nav class="sca-nav" aria-label="Scènes du chapitre">
      <dw-scroller class="sca-scroller" label="Scènes du chapitre">
        <ol class="sca-actes">
          @for (acte of store.acts(); track acte.scene.id) {
            <li class="sca-li">
              <button
                type="button"
                class="sca-acte"
                [class.sca-acte--en-cours]="acte.statut === 'en-cours'"
                [class.sca-acte--jouee]="acte.statut === 'jouee'"
                [attr.aria-current]="acte.statut === 'en-cours' ? 'step' : null"
                [attr.aria-label]="label(acte)"
                [attr.aria-disabled]="store.busy() ? 'true' : null"
                [matMenuTriggerFor]="apercu.menu()"
                [matMenuTriggerData]="{acte}"
              >
                <span class="sca-num" aria-hidden="true">
                  @if (acte.statut === 'jouee') {
                    <mat-icon>check</mat-icon>
                  } @else {
                    {{ acte.numero }}
                  }
                </span>
                @if (acte.statut === 'en-cours') {
                  <span class="sca-acte-titre" aria-hidden="true">{{ acte.scene.titre }}</span>
                }
              </button>
            </li>
          } @empty {
            <li class="sca-vide">Aucune scène dans ce chapitre.</li>
          }
        </ol>
      </dw-scroller>
    </nav>

    <bol-scene-apercu-menu #apercu="apercuMenu" (sceneChanged)="sceneChanged.emit($event)" />
  `,
  styles: `
    // Comme la barre de la maquette : le titre du scénario à gauche, la frise des actes centrée.
    :host {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      min-width: 0;
    }

    .sca-titre {
      flex-shrink: 0;
      min-width: 0;
      max-width: 18rem;
    }

    .sca-sur {
      display: block;
      overflow: hidden;
      color: var(--dw-forge-gold);
      font-size: 0.7rem;
      line-height: 1.45;
      letter-spacing: 0.08em;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .sca-h1 {
      display: flex;
      margin: 0;
      font-size: 1.3rem;
      line-height: 1.1;
    }

    .sca-scenario-titre {
      min-width: 0;
      color: var(--dw-forge-bone);
      font-family: 'Muse Display Harmony', serif;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    // La frise : centrée ; si elle déborde, elle défile avec un chevron de chaque côté (les marges automatiques
    // centrent sans rogner).
    .sca-nav {
      flex: 1;
      min-width: 0;
      display: flex;
    }

    .sca-scroller {
      flex: 1;
      min-width: 0;
    }

    .sca-actes {
      display: flex;
      align-items: center;
      width: max-content;
      margin: 0 auto;
      padding: 0.2rem 0.1rem;
      list-style: none;
    }

    .sca-li {
      display: flex;
      align-items: center;
    }

    // Une chaîne de bronze relie les actes.
    .sca-li + .sca-li::before {
      content: '';
      width: clamp(0.75rem, 2vw, 2.2rem);
      height: 2px;
      background: linear-gradient(180deg, #e0bb7c, #6b4a22);
      box-shadow: 0 1px 1px #000;
    }

    // Un jeton frappé ; une scène jouée est un creux, celle en cours rougeoie.
    .sca-acte {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      height: 2rem;
      min-width: 2rem;
      padding: 0 0.15rem;
      border: 1px solid var(--dw-forge-bronze-dim);
      border-radius: 999px;
      background: var(--dw-forge-token);
      box-shadow: var(--dw-forge-token-shadow);
      color: var(--dw-surface-700);
      font: inherit;
      font-size: 0.8rem;
      font-variant-numeric: tabular-nums;
      cursor: pointer;
      transition:
        border-color 0.15s,
        background 0.15s;

      &:hover {
        border-color: var(--dw-forge-hot);
        color: var(--dw-forge-hot-text);
      }

      &:focus-visible {
        outline: 2px solid var(--dw-color-legendary);
        outline-offset: 2px;
      }

      &[aria-disabled='true'] {
        cursor: progress;
      }
    }

    .sca-num {
      display: grid;
      place-items: center;
      flex-shrink: 0;
      width: 1.6rem;
      height: 1.6rem;
      border-radius: 50%;
      font-weight: 700;

      .mat-icon {
        width: 0.85rem;
        height: 0.85rem;
        font-size: 0.85rem;
      }
    }

    .sca-acte--jouee {
      background: var(--dw-forge-recess);
      box-shadow: var(--dw-forge-recess-shadow);

      .sca-num {
        color: var(--dw-forge-verdict-reussite);
      }
    }

    .sca-acte--en-cours {
      padding-right: 0.85rem;
      border-color: var(--dw-forge-hot);
      background: linear-gradient(180deg, #3b2610, #22160b);
      box-shadow:
        inset 0 1px 0 rgba(255, 225, 170, 0.22),
        0 0 16px rgba(232, 135, 58, 0.5);
      color: var(--dw-forge-bone);

      .sca-num {
        background: var(--dw-forge-coin);
        color: #1c1200;
      }
    }

    .sca-acte-titre {
      max-width: 18rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .sca-vide {
      color: var(--dw-surface-600);
      font-size: 0.82rem;
      white-space: nowrap;
    }

    // Petits écrans : la frise passe sous le titre.
    @media (max-width: 56rem) {
      :host {
        flex-wrap: wrap;
        row-gap: 0.4rem;
      }

      .sca-nav {
        flex-basis: 100%;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .sca-acte {
        transition: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneActsComponent {
  protected readonly store = inject(SceneStageStore);

  /** Titre de la session, en sur-titre au-dessus du scénario. */
  readonly sessionTitre = input<string | null>(null);
  /** Une scène vient d'être chargée sur la table, avec la session à jour : la page la pose. */
  readonly sceneChanged = output<BolSceneLoadResult>();

  protected readonly scenarioTitre = computed(
    () => this.store.scenarios().find((s) => s.id === this.store.scenarioId())?.titre ?? 'On improvise',
  );
  private readonly nav = viewChild.required<ElementRef<HTMLElement>>('nav');
  /** L'id seul : une copie de la même scène (préparation, rechargement) ne refait pas défiler la frise. */
  private readonly acteEnCours = computed(() => this.store.acts().find((acte) => acte.statut === 'en-cours')?.scene.id ?? null);

  constructor() {
    // Les portraits de l'aperçu viennent du catalogue, chargé ici même si les coulisses restent fermées.
    inject(CombatSelectionService).loadCatalog();

    // Une frise trop longue défile : l'acte en cours, seul à montrer son titre, revient au centre de la vue.
    afterRenderEffect(() => {
      if (!this.acteEnCours()) {
        return;
      }
      // La piste du défileur (`dw-scroller`) est l'élément qui défile.
      const piste = this.nav().nativeElement.querySelector<HTMLElement>('.dws-track');
      const acte = piste?.querySelector<HTMLElement>('.sca-acte--en-cours');
      if (!piste || !acte || piste.scrollWidth <= piste.clientWidth) {
        return;
      }
      const pisteRect = piste.getBoundingClientRect();
      const acteRect = acte.getBoundingClientRect();
      piste.scrollLeft += acteRect.left - pisteRect.left - (pisteRect.width - acteRect.width) / 2;
    });
  }

  protected label(acte: SceneActe): string {
    return acteLabel(acte);
  }
}
