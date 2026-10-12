import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {CombatEffect, NewEffect} from '../../models/combat-effect.model';
import {EFFETS_MODELES, libelleDuree, libelleEffet} from './combat-effects.util';

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
}

/** Les effets en cours sur les deux duellistes, chacun retirable, et le menu pour en ajouter un à la main. */
@Component({
  selector: 'bol-effects-list',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="efl" aria-label="Effets en cours">
      <header class="efl-head">
        <h3 class="efl-title">Effets en cours</h3>
        <button type="button" mat-stroked-button size="small" [matMenuTriggerFor]="addMenu" [disabled]="cartes().length === 0">
          <mat-icon>add</mat-icon> Effet
        </button>
      </header>

      @for (effet of affiches(); track effet.id) {
        <div class="efl-row">
          <span class="efl-text"><b>{{ effet.porteur }}</b> · {{ effet.texte }} <i>{{ effet.duree }}</i></span>
          <button type="button" class="efl-remove" [attr.aria-label]="'Retirer l’effet ' + effet.texte + ' de ' + effet.porteur" (click)="retire.emit(effet.id)">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      } @empty {
        <p class="efl-empty">Aucun effet en cours.</p>
      }

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
    .efl { display: flex; flex-direction: column; gap: 0.35rem; }
    .efl-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
    .efl-title { margin: 0; font-size: 0.66rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: var(--dw-color-legendary); }
    .efl-row { display: flex; align-items: center; justify-content: space-between; gap: 0.4rem; padding: 0.2rem 0.4rem; border: 1px solid var(--dw-border); border-radius: 8px; background: var(--dw-surface-50); font-size: 0.78rem; color: var(--dw-surface-800); }
    .efl-text i { color: var(--dw-surface-600); font-style: normal; }
    .efl-remove { display: grid; place-items: center; width: 1.5rem; height: 1.5rem; padding: 0; border: 0; border-radius: 6px; background: transparent; color: var(--dw-surface-500); cursor: pointer; }
    .efl-remove:hover { color: var(--dw-color-echec); }
    .efl-remove:focus-visible { outline: 2px solid var(--dw-color-legendary); outline-offset: 1px; }
    .efl-remove .mat-icon { width: 1rem; height: 1rem; font-size: 1rem; }
    .efl-empty { margin: 0; font-size: 0.78rem; color: var(--dw-surface-500); }
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
      .filter((effet) => effet.valeur !== 0 && noms.has(effet.porteur))
      .map((effet) => ({
        id: effet.id,
        porteur: noms.get(effet.porteur) ?? effet.porteur,
        texte: `${effet.valeur > 0 ? '+' : '−'} ${Math.abs(effet.valeur)} ${libelleEffet(effet)}`,
        duree: libelleDuree(effet.duree),
      }));
  });
}
