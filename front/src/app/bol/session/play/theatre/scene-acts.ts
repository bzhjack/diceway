import {ChangeDetectionStrategy, Component, computed, inject, input, output} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {BolSceneLoadResult} from '../../../models/bol-scene.model';
import {CombatSelectionService} from '../../../services/combat-selection.service';
import {SceneActe} from '../../models/theatre.model';
import {SceneApercuMenuComponent} from './scene-apercu-menu';
import {SceneStageStore} from './scene-stage.store';
import {acteLabel} from './theatre.util';

/** Le titre et la frise des actes, dans l'en-tête de la table : la session en sur-titre, le scénario affiché (son
 * titre ouvre le menu pour en changer) et ses scènes en pastilles numérotées reliées par un filet. Une pastille ouvre
 * le menu d'aperçu de la scène (`bol-scene-apercu-menu`). Signale à la page (`sceneChanged`) chaque scène chargée. */
@Component({
  selector: 'bol-scene-acts',
  imports: [MatIconModule, MatMenuModule, SceneApercuMenuComponent],
  template: `
    <div class="sca-titre">
      <span class="sca-sur">{{ sessionTitre() || 'Session' }}</span>
      <h1 class="sca-h1">
        <button type="button" class="sca-scenario" [matMenuTriggerFor]="scenarios" [attr.aria-label]="'Changer de scénario, scénario affiché : ' + scenarioTitre()">
          <span class="sca-scenario-titre">{{ scenarioTitre() }}</span>
          <mat-icon aria-hidden="true">expand_more</mat-icon>
        </button>
      </h1>
    </div>
    <mat-menu #scenarios="matMenu">
      <button mat-menu-item type="button" (click)="store.selectScenario(null)">Sans scénario</button>
      @for (scenario of sortedScenarios(); track scenario.id) {
        <button mat-menu-item type="button" (click)="store.selectScenario(scenario.id)">{{ scenario.titre }}</button>
      }
    </mat-menu>

    <nav class="sca-nav" aria-label="Scènes du scénario">
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
          <li class="sca-vide">Aucune scène dans ce scénario.</li>
        }
      </ol>
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
      color: #d9a441;
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

    // Le titre du scénario ouvre le menu des scénarios.
    .sca-scenario {
      display: inline-flex;
      align-items: center;
      gap: 0.2rem;
      max-width: 100%;
      padding: 0;
      border: none;
      background: none;
      color: #f1e6d0;
      font-family: 'Muse Display Harmony', serif;
      font-size: 1.3rem;
      line-height: 1.1;
      cursor: pointer;

      .mat-icon {
        flex-shrink: 0;
        width: 1.1rem;
        height: 1.1rem;
        font-size: 1.1rem;
        color: #9c8763;
      }

      &:hover .mat-icon {
        color: #d9a441;
      }

      &:focus-visible {
        outline: 2px solid var(--dw-color-legendary);
        outline-offset: 3px;
        border-radius: 4px;
      }
    }

    .sca-scenario-titre {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    // La frise : centrée, défile si elle déborde (les marges automatiques centrent sans rogner).
    .sca-nav {
      flex: 1;
      min-width: 0;
      display: flex;
      overflow-x: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(217, 164, 65, 0.35) transparent;
    }

    .sca-actes {
      display: flex;
      align-items: center;
      margin: 0 auto;
      padding: 0.2rem 0.1rem;
      list-style: none;
    }

    .sca-li {
      display: flex;
      align-items: center;
    }

    // Un filet de bronze relie les actes.
    .sca-li + .sca-li::before {
      content: '';
      width: clamp(0.75rem, 2vw, 2.2rem);
      height: 1px;
      background: linear-gradient(90deg, #6b4a16, #8c6a2f);
    }

    .sca-acte {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      height: 2rem;
      min-width: 2rem;
      padding: 0 0.15rem;
      border: 1px solid #6b4a16;
      border-radius: 999px;
      background: #150e09;
      color: #b59d78;
      font: inherit;
      font-size: 0.8rem;
      font-variant-numeric: tabular-nums;
      cursor: pointer;
      transition:
        border-color 0.15s,
        background 0.15s;

      &:hover {
        border-color: #d9a441;
        color: #f1e6d0;
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
        width: 1.05rem;
        height: 1.05rem;
        font-size: 1.05rem;
      }
    }

    .sca-acte--jouee {
      background: #1d150f;
      color: #9c8763;

      .sca-num {
        color: #22c55e;
      }
    }

    .sca-acte--en-cours {
      padding-right: 0.85rem;
      border-color: #d9a441;
      background: linear-gradient(180deg, #3b2610, #22160b);
      box-shadow: 0 0 16px rgba(217, 164, 65, 0.28);
      color: #f1e6d0;

      .sca-num {
        background: #d9a441;
        color: #1a1203;
      }
    }

    .sca-acte-titre {
      max-width: 18rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .sca-vide {
      color: #9c8763;
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

  protected readonly sortedScenarios = computed(() =>
    [...this.store.scenarios()].sort((left, right) => left.titre.localeCompare(right.titre, 'fr')),
  );
  protected readonly scenarioTitre = computed(
    () => this.store.scenarios().find((s) => s.id === this.store.scenarioId())?.titre ?? 'Sans scénario',
  );

  constructor() {
    // Les portraits de l'aperçu viennent du catalogue, chargé ici même si les coulisses restent fermées.
    inject(CombatSelectionService).loadCatalog();
  }

  protected label(acte: SceneActe): string {
    return acteLabel(acte);
  }
}
