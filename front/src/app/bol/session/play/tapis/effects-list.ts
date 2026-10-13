import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {CombatEffect, NewEffect} from '../../models/combat-effect.model';
import {descriptionEffet, EFFETS_MODELES, libelleDuree} from './combat-effects.util';

/** Une carte nommée, pour afficher à qui appartient un effet et à qui l'ajouter. */
interface CarteEffets {
  readonly key: string;
  readonly nom: string;
}

/** Un effet prêt à afficher : son texte, sa durée et à qui il est. */
interface EffetAffiche {
  readonly id: string;
  readonly porteur: string;
  readonly texte: string;
  readonly duree: string;
  /** Un effet déduit de l'état (identifiant `derive-…`) n'est pas stocké : rien à retirer. */
  readonly retirable: boolean;
}

/** Les effets en cours sur les deux duellistes, en pastilles sur une ligne, chacun retirable, et le menu pour en ajouter un à la main. */
@Component({
  selector: 'bol-effects-list',
  imports: [MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="efl" aria-label="Effets en cours">
      @for (effet of affiches(); track effet.id) {
        <div class="efl-row">
          <span class="efl-text"><b>{{ effet.porteur }}</b> · {{ effet.texte }} <i>{{ effet.duree }}</i></span>
          @if (effet.retirable) {
            <button type="button" class="efl-remove" [attr.aria-label]="'Retirer l’effet ' + effet.texte + ' de ' + effet.porteur" (click)="retire.emit(effet.id)">
              <mat-icon>close</mat-icon>
            </button>
          }
        </div>
      } @empty {
        <p class="efl-empty">Aucun</p>
      }

      <button type="button" class="efl-add" [matMenuTriggerFor]="addMenu" [disabled]="cartes().length === 0">
        <mat-icon aria-hidden="true">add</mat-icon> Effet
      </button>

      <mat-menu #addMenu="matMenu">
        @for (carte of cartes(); track carte.key) {
          @for (modele of modeles; track modele.id) {
            <button mat-menu-item type="button" (click)="ajoute.emit(modele.creer(carte.key))">{{ carte.nom }} : {{ modele.libelle }}</button>
          }
        }
      </mat-menu>
    </section>
  `,
  styles: `
    /* Dans la carte de l'attaquant (qui porte le titre « Effets ») : une pastille par effet, puis le bouton qui en ajoute un. */
    .efl { display: flex; flex-wrap: wrap; align-items: center; gap: 0.3rem 0.5rem; }
    .efl-row { display: flex; align-items: center; gap: 0.2rem; padding: 0.05rem 0.2rem 0.05rem 0.6rem; border: 1px solid var(--dw-border); border-radius: 14px; background: var(--dw-surface-50); font-size: 0.78rem; line-height: 1.3; color: var(--dw-surface-800); }
    .efl-text i { color: var(--dw-surface-600); font-style: normal; }
    .efl-remove { display: grid; place-items: center; width: 1.4rem; height: 1.4rem; padding: 0; border: 0; border-radius: 50%; background: transparent; color: var(--dw-surface-500); cursor: pointer; }
    .efl-remove:hover { color: var(--dw-color-echec); }
    .efl-remove:focus-visible { outline: 2px solid var(--dw-color-legendary); outline-offset: 1px; }
    .efl-remove .mat-icon { width: 1rem; height: 1rem; font-size: 1rem; }
    .efl-empty { margin: 0; font-size: 0.8rem; color: var(--dw-surface-500); }
    /* Le bouton qui ajoute un effet : de la taille des boutons « Fiche » et « Défense totale » de l'assistant. */
    .efl-add { display: inline-flex; align-items: center; gap: 0.2rem; padding: 0.3rem 0.65rem 0.3rem 0.45rem; border: 1px solid var(--dw-border); border-radius: 8px; background: var(--dw-surface-50); color: var(--dw-surface-700); font: inherit; font-size: 0.8rem; font-weight: 700; cursor: pointer; }
    .efl-add:hover:not(:disabled) { border-color: var(--dw-surface-500); color: var(--dw-surface-900); }
    .efl-add:disabled { opacity: 0.45; cursor: default; }
    .efl-add:focus-visible { outline: 2px solid var(--dw-color-legendary); outline-offset: 2px; }
    .efl-add .mat-icon { width: 1rem; height: 1rem; font-size: 1rem; }
  `,
})
export class EffectsListComponent {
  readonly effets = input.required<readonly CombatEffect[]>();
  /** Les deux cartes du duel : attaquant et cible. Une carte absente de cette liste n'affiche pas ses effets. */
  readonly cartes = input.required<readonly CarteEffets[]>();
  readonly retire = output<string>();
  readonly ajoute = output<NewEffect>();

  protected readonly modeles = EFFETS_MODELES;

  protected readonly affiches = computed<readonly EffetAffiche[]>(() => {
    const noms = new Map(this.cartes().map((carte) => [carte.key, carte.nom]));
    return this.effets()
      .filter((effet) => noms.has(effet.porteur))
      .map((effet) => ({
        id: effet.id,
        porteur: noms.get(effet.porteur) ?? effet.porteur,
        texte: descriptionEffet(effet),
        duree: libelleDuree(effet.duree),
        retirable: !effet.id.startsWith('derive-'),
      }));
  });
}
