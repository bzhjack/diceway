import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {DemonConformite} from '../../models/demon-regles.model';

/**
 * « Selon le livre » : le démon en cours face aux règles de création de sa catégorie (p. 129-130), une case par budget (attributs,
 * aptitudes de combat, pouvoirs, vitalité) et les écarts particuliers. Rien n'y est refusé ; la vitalité se recalcule d'un clic.
 */
@Component({
  selector: 'bol-demon-regles',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <h2 id="drg-titre" class="dw-section-eyebrow drg-titre">Selon le livre</h2>
    <ul class="drg-lignes" aria-labelledby="drg-titre">
      @for (ligne of conformite().lignes; track ligne.cle) {
        <li class="drg-ligne" [class]="'drg-ligne--' + ligne.etat">
          <span class="drg-libelle">{{ ligne.libelle }}</span>
          <span class="drg-valeur">{{ ligne.valeur }} / {{ ligne.attendu }}</span>
          <span class="drg-detail">
            @if (ligne.etat === 'ok') {
              <mat-icon class="drg-icone" aria-hidden="true">check</mat-icon>
            }
            {{ ligne.detail }}
            @if (ligne.cle === 'vitalite' && ligne.etat === 'ecart') {
              <button mat-button type="button" class="drg-recalculer" (click)="recalculer.emit(conformite().vitaliteAttendue)">Recalculer</button>
            }
          </span>
        </li>
      }
    </ul>
    @if (conformite().avertissements.length) {
      <ul class="drg-avertissements" aria-label="Écarts aux règles">
        @for (avertissement of conformite().avertissements; track avertissement) {
          <li><mat-icon class="drg-icone" aria-hidden="true">warning</mat-icon> {{ avertissement }}</li>
        }
      </ul>
    }
  `,
  styleUrl: './demon-regles.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemonReglesComponent {
  readonly conformite = input.required<DemonConformite>();
  /** La vitalité que donne la règle, à poser sur la fiche. */
  readonly recalculer = output<number>();
}
