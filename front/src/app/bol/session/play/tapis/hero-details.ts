import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatTooltipModule} from '@angular/material/tooltip';
import {HeroDetails} from './tapis.util';

/** Trois boutons sous le nom d'un héros — carrières, armes, armures — qui ouvrent chacun un popover avec le
 * détail. Un bouton ne montre que son icône et le nombre (nom en infobulle) : la liste peut être longue
 * (sept armures…) et la place manque à côté des statistiques. Les armures équipées
 * sont marquées. Ne modifie rien : l'équipement se change dans la fiche complète. */
@Component({
  selector: 'bol-hero-details',
  imports: [MatIconModule, MatMenuModule, MatTooltipModule],
  template: `
    <button
      type="button"
      class="hd-chip"
      [matMenuTriggerFor]="carrieresMenu"
      matTooltip="Carrières"
      [attr.aria-label]="'Carrières, ' + details().carrieres.length + ' : afficher le détail'"
    >
      <mat-icon>military_tech</mat-icon> <b>{{ details().carrieres.length }}</b>
      <mat-icon class="hd-caret">arrow_drop_down</mat-icon>
    </button>
    <button
      type="button"
      class="hd-chip"
      [matMenuTriggerFor]="armesMenu"
      matTooltip="Armes"
      [attr.aria-label]="'Armes, ' + details().armes.length + ' : afficher le détail'"
    >
      <mat-icon svgIcon="sword" /> <b>{{ details().armes.length }}</b>
      <mat-icon class="hd-caret">arrow_drop_down</mat-icon>
    </button>
    <button
      type="button"
      class="hd-chip"
      [matMenuTriggerFor]="armuresMenu"
      matTooltip="Armures"
      [attr.aria-label]="'Armures, ' + details().armures.length + ' : afficher le détail'"
    >
      <mat-icon>shield</mat-icon> <b>{{ details().armures.length }}</b>
      <mat-icon class="hd-caret">arrow_drop_down</mat-icon>
    </button>

    <mat-menu #carrieresMenu="matMenu" class="hd-menu">
      <div class="hd-panel" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()" tabindex="-1">
        <h4 class="hd-title">Carrières</h4>
        <ul class="hd-list">
          @for (carriere of details().carrieres; track carriere.label) {
            <li class="hd-row">
              <span class="hd-name">{{ carriere.label }}</span>
              <span class="hd-value">{{ carriere.value }}</span>
            </li>
          } @empty {
            <li class="hd-empty">Aucune carrière.</li>
          }
        </ul>
      </div>
    </mat-menu>

    <mat-menu #armesMenu="matMenu" class="hd-menu">
      <div class="hd-panel" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()" tabindex="-1">
        <h4 class="hd-title">Armes</h4>
        <ul class="hd-list">
          @for (arme of details().armes; track arme.label) {
            <li class="hd-row">
              <span class="hd-name">{{ arme.label }}</span>
              <span class="hd-value">{{ arme.degats || '—' }}</span>
              @if (arme.portee) {
                <span class="hd-note">{{ arme.portee }}</span>
              }
            </li>
          } @empty {
            <li class="hd-empty">Aucune arme.</li>
          }
        </ul>
      </div>
    </mat-menu>

    <mat-menu #armuresMenu="matMenu" class="hd-menu">
      <div class="hd-panel" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()" tabindex="-1">
        <h4 class="hd-title">Armures</h4>
        <ul class="hd-list">
          @for (armure of details().armures; track armure.label) {
            <li class="hd-row" [class.hd-row--on]="armure.equipee">
              <span class="hd-name">
                @if (armure.equipee) {
                  <mat-icon class="hd-on" aria-label="Équipée">check_circle</mat-icon>
                }
                {{ armure.label }}
              </span>
              @if (armure.categorie === 'bouclier') {
                <!-- La « protection » d'un bouclier est une règle en toutes lettres, pas une valeur de dés. -->
                <span class="hd-value">—</span>
                @if (armure.protection) {
                  <span class="hd-note">{{ armure.protection }}</span>
                }
              } @else {
                <span class="hd-value">{{ armure.protection || '—' }}</span>
              }
              @if (armure.malus) {
                <span class="hd-note">{{ armure.malus }}</span>
              }
            </li>
          } @empty {
            <li class="hd-empty">Aucune armure.</li>
          }
        </ul>
      </div>
    </mat-menu>
  `,
  styleUrl: './hero-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroDetailsComponent {
  readonly details = input.required<HeroDetails>();
}
