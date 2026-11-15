import {CdkTrapFocus} from '@angular/cdk/a11y';
import {CdkConnectedOverlay, CdkOverlayOrigin} from '@angular/cdk/overlay';
import {ChangeDetectionStrategy, Component, computed, input, model, signal} from '@angular/core';
import {form, FormField} from '@angular/forms/signals';
import {MatIconModule} from '@angular/material/icon';
import {matchesTerm} from '../../../../shared/list.utils';
import {DwPopoverDirective} from '../../../../shared/popover/popover.directive';
import {LibraryOption} from '../../models/library-rows.model';

let suivant = 0;

/** Au-delà de ce nombre d'options (les scénarios, les régions), la liste a sa recherche. */
const AVEC_RECHERCHE = 8;

/**
 * Un filtre à choix unique de la barre d'une bibliothèque en tuiles (rang, scénario, taille, catégorie, région) : un bouton qui dit son
 * titre, ou sa valeur, bordé d'or, dès qu'elle est choisie (aucun rappel ailleurs) ; il ouvre la liste des options, chacune avec son
 * nombre de fiches, « Tous… » en tête (le filtre revient à `vide`). Un clic choisit et referme ; un clic sur l'option choisie la retire.
 * Plus de huit options : une recherche au-dessus, la liste défile. Une option avec une teinte (un scénario) a son point de couleur. Les
 * styles sont ceux de `styles/_library-rows.scss`.
 */
@Component({
  selector: 'bol-library-facette',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, CdkTrapFocus, DwPopoverDirective, FormField, MatIconModule],
  template: `
    <button
      type="button"
      class="dw-lr-choix"
      [class.dw-lr-choix--pose]="pose()"
      cdkOverlayOrigin
      #origine="cdkOverlayOrigin"
      aria-haspopup="dialog"
      [attr.aria-expanded]="ouvert()"
      [attr.aria-controls]="ouvert() ? listeId : null"
      [attr.aria-label]="titre() + ' : ' + (choisie()?.label ?? tous())"
      (click)="ouvert.set(!ouvert())"
    >
      @if (choisie()?.teinte; as teinte) {
        <span class="dw-lr-point" [class]="'dw-saga--' + teinte" aria-hidden="true"></span>
      }
      <span class="dw-lr-choix-valeur">{{ choisie()?.label ?? titre() }}</span>
      <mat-icon aria-hidden="true">expand_more</mat-icon>
    </button>
    <ng-template
      cdkConnectedOverlay
      dwPopover="start"
      [cdkConnectedOverlayOrigin]="origine"
      [cdkConnectedOverlayOpen]="ouvert()"
      (backdropClick)="fermer()"
      (overlayKeydown)="touche($event)"
      (detach)="fermer()"
    >
      <div class="dw-lr-menu" role="dialog" [attr.aria-label]="titre()" [id]="listeId" cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
        @if (avecRecherche()) {
          <label class="dw-lr-menu-recherche">
            <mat-icon aria-hidden="true">search</mat-icon>
            <input type="text" placeholder="Chercher…" [formField]="termeField" [attr.aria-label]="'Chercher : ' + titre()" />
          </label>
        }
        <button type="button" class="dw-lr-option" [attr.aria-pressed]="!pose()" (click)="choisir(vide())">
          <span class="dw-lr-option-label">{{ tous() }}</span>
          @if (total() !== undefined) {
            <span class="dw-lr-option-compte">{{ total() }}</span>
          }
        </button>
        <div class="dw-lr-menu-liste">
          @for (option of visibles(); track option.cle) {
            <button
              type="button"
              class="dw-lr-option"
              [class]="option.teinte ? 'dw-saga--' + option.teinte : ''"
              [attr.aria-pressed]="pose() && valeur() === option.cle"
              (click)="choisir(option.cle)"
            >
              @if (option.teinte) {
                <span class="dw-lr-point" aria-hidden="true"></span>
              }
              <span class="dw-lr-option-label">{{ option.label }}</span>
              <span class="dw-lr-option-compte">{{ option.compte }}</span>
            </button>
          } @empty {
            <p class="dw-lr-facette-vide">Aucun résultat.</p>
          }
        </div>
      </div>
    </ng-template>
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryFacetteComponent<T> {
  readonly titre = input.required<string>();
  readonly options = input.required<readonly LibraryOption<T>[]>();
  readonly valeur = model.required<T>();
  /** La valeur « aucun choix », celle de « Tous… ». */
  readonly vide = input.required<T>();
  /** Le libellé de l'option qui retire le filtre : « Tous les rangs », « Toutes les régions ». */
  readonly tous = input.required<string>();
  /** Le nombre de fiches de « Tous… » : toutes celles de la bibliothèque. */
  readonly total = input<number>();

  protected readonly listeId = `dw-lr-menu-${++suivant}`;
  protected readonly ouvert = signal(false);
  protected readonly terme = signal('');
  protected readonly termeField = form(this.terme);

  protected readonly pose = computed(() => this.valeur() !== this.vide());
  protected readonly choisie = computed(() => (this.pose() ? this.options().find((o) => o.cle === this.valeur()) : undefined));
  protected readonly avecRecherche = computed(() => this.options().length > AVEC_RECHERCHE);
  protected readonly visibles = computed(() => this.options().filter((o) => matchesTerm(this.terme(), o.label)));

  protected choisir(cle: T): void {
    this.valeur.set(this.pose() && this.valeur() === cle ? this.vide() : cle);
    this.fermer();
  }

  protected fermer(): void {
    this.ouvert.set(false);
    this.terme.set('');
  }

  protected touche(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.fermer();
    }
  }
}
