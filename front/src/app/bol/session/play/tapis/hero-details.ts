import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatTooltipModule} from '@angular/material/tooltip';
import {HeroDetails} from '../../models/tapis.model';

/** Les boutons sous le nom d'un héros — carrières, traits, armes, armures, informations — ouvrent chacun un
 * popover avec le détail. Un bouton ne montre que son icône et le nombre (nom en infobulle) : la liste peut
 * être longue (sept armures…) et la place manque à côté des statistiques. Dans les popovers des armes et des
 * armures, un clic équipe ou déséquipe (une seule armure par catégorie, plusieurs armes possibles) : le
 * composant le signale, c'est la page qui enregistre. */
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
      [matMenuTriggerFor]="traitsMenu"
      matTooltip="Traits"
      [attr.aria-label]="'Traits, ' + details().traits.length + ' : afficher le détail'"
    >
      <mat-icon>auto_awesome</mat-icon> <b>{{ details().traits.length }}</b>
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

    @if (hasInfos()) {
      <button
        type="button"
        class="hd-chip"
        [matMenuTriggerFor]="infosMenu"
        matTooltip="Informations"
        aria-label="Informations sur le personnage : afficher le détail"
      >
        <mat-icon>info</mat-icon>
        <mat-icon class="hd-caret">arrow_drop_down</mat-icon>
      </button>
    }

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

    <mat-menu #traitsMenu="matMenu" class="hd-menu">
      <div class="hd-panel" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()" tabindex="-1">
        <h4 class="hd-title">Traits</h4>
        <ul class="hd-list">
          @for (trait of details().traits; track trait.label) {
            <li class="hd-row">
              <span class="hd-name">{{ trait.label }}</span>
              <span class="hd-kind" [class.hd-kind--bad]="trait.kind === 'desavantage'">
                {{ trait.kind === 'avantage' ? 'Avantage' : 'Désavantage' }}
              </span>
              @if (trait.detail) {
                <span class="hd-note">{{ trait.detail }}</span>
              }
            </li>
          } @empty {
            <li class="hd-empty">Aucun trait.</li>
          }
        </ul>
      </div>
    </mat-menu>

    <mat-menu #infosMenu="matMenu" class="hd-menu">
      <div class="hd-panel" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()" tabindex="-1">
        <h4 class="hd-title">Informations</h4>
        <dl class="hd-infos">
          @if (details().infos.enCours) {
            <div><dt>Fiche</dt><dd>En cours de création</dd></div>
          }
          @if (details().infos.commentaire; as commentaire) {
            <div><dt>Commentaire</dt><dd>{{ commentaire }}</dd></div>
          }
        </dl>
      </div>
    </mat-menu>

    <mat-menu #armesMenu="matMenu" class="hd-menu">
      <div class="hd-panel" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()" tabindex="-1">
        <h4 class="hd-title">Armes</h4>
        <ul class="hd-list">
          @for (arme of details().armes; track arme.id) {
            <li>
              <button
                type="button"
                class="hd-row hd-row--button"
                [class.hd-row--on]="arme.equipee"
                [attr.aria-pressed]="arme.equipee"
                [attr.aria-label]="(arme.equipee ? 'Déséquiper ' : 'Équiper ') + arme.label"
                (click)="armeToggled.emit(arme.id)"
              >
                <span class="hd-name">
                  @if (arme.equipee) {
                    <mat-icon class="hd-on" aria-label="Équipée">check_circle</mat-icon>
                  }
                  {{ arme.label }}
                </span>
                <span class="hd-value">{{ arme.degats || '—' }}</span>
                @if (arme.portee) {
                  <span class="hd-note">{{ arme.portee }}</span>
                }
              </button>
            </li>
          } @empty {
            <li class="hd-empty">Aucune arme.</li>
          }
        </ul>
        @if (details().armes.length) {
          <p class="hd-hint">Un clic équipe ou déséquipe une arme. Seules les armes équipées sont proposées à l'attaque.</p>
        }
      </div>
    </mat-menu>

    <mat-menu #armuresMenu="matMenu" class="hd-menu">
      <div class="hd-panel" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()" tabindex="-1">
        <h4 class="hd-title">Armures</h4>
        <ul class="hd-list">
          @for (armure of details().armures; track armure.label) {
            <li>
            <button
              type="button"
              class="hd-row hd-row--button"
              [class.hd-row--on]="armure.equipee"
              [attr.aria-pressed]="armure.equipee"
              [attr.aria-label]="(armure.equipee ? 'Déséquiper ' : 'Équiper ') + armure.label"
              (click)="armureToggled.emit(armure.id)"
            >
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
            </button>
            </li>
          } @empty {
            <li class="hd-empty">Aucune armure.</li>
          }
        </ul>
        @if (details().armures.length) {
          <p class="hd-hint">Un clic équipe ou déséquipe une armure.</p>
        }
      </div>
    </mat-menu>
  `,
  styleUrl: './hero-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroDetailsComponent {
  readonly details = input.required<HeroDetails>();
  /** Un clic sur une armure du popover : l'id de l'armure à équiper ou déséquiper. */
  readonly armureToggled = output<number>();
  /** Un clic sur une arme du popover : l'id de l'arme à équiper ou déséquiper. */
  readonly armeToggled = output<number>();

  protected readonly hasInfos = computed(() => {
    const infos = this.details().infos;
    return infos.enCours || Boolean(infos.commentaire);
  });
}
