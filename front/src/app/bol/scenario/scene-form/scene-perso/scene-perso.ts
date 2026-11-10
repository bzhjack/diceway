import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {AvatarFallbackDirective} from '../../../../shared/avatar-fallback/avatar-fallback.directive';
import {CombatCamp} from '../../../models/bol-fight-session.model';
import {BolSceneDistributionSaisie} from '../../../models/bol-scene.model';
import {ATTITUDES} from '../../../session/play/theatre/theatre.util';
import {ScenePersonnageVue} from '../../models/scene-form.model';
import {aUnPortrait, QTY_MAX} from '../scene-form.util';

/**
 * Un personnage de la distribution d'« Ajouter des personnages », en petit : son portrait et son nombre, son nom, de quoi le retirer ;
 * dessous, un de plus ou de moins, son camp, et son attitude dans un menu. Le liseré dit le camp. Ne fait que
 * dire le réglage (`regle`) ou le retrait (`retire`).
 */
@Component({
  selector: 'bol-scene-perso',
  imports: [AvatarFallbackDirective, MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    <div class="spe" [class.spe--allie]="perso().camp === 'heros'" [class.spe--introuvable]="perso().introuvable" [class.spe--nouveau]="nouveau()">
      <span class="spe-portrait">
        @if (portrait()) {
          <img dwAvatarFallback [src]="perso().avatar" alt="" />
        } @else {
          <span class="spe-initiale" aria-hidden="true">{{ perso().nom.charAt(0) }}</span>
        }
        <span class="spe-nombre">{{ perso().qty }}</span>
      </span>
      <span class="spe-nom">
        <span class="spe-texte">{{ perso().nom }}</span>
        @if (nouveau()) {
          <span class="spe-nouveau">nouveau</span>
        }
      </span>
      <button mat-icon-button type="button" class="spe-retirer" [attr.aria-label]="'Retirer ' + perso().nom" (click)="retire.emit()">
        <mat-icon>close</mat-icon>
      </button>

      <div class="spe-reglages">
        <button type="button" class="spe-rond" [attr.aria-label]="'Un ' + perso().nom + ' de moins'" [disabled]="perso().qty <= 1" (click)="regle.emit({qty: perso().qty - 1})">
          <mat-icon>remove</mat-icon>
        </button>
        <button type="button" class="spe-rond" [attr.aria-label]="'Un ' + perso().nom + ' de plus'" [disabled]="perso().qty >= qtyMax" (click)="regle.emit({qty: perso().qty + 1})">
          <mat-icon>add</mat-icon>
        </button>
        <span class="spe-camp" role="group" [attr.aria-label]="'Camp de ' + perso().nom">
          <button type="button" class="spe-camp-option spe-camp-option--adversaires" [attr.aria-pressed]="perso().camp === 'adversaires'" (click)="choisirLeCamp('adversaires')">
            Adversaire
          </button>
          <button type="button" class="spe-camp-option spe-camp-option--heros" [attr.aria-pressed]="perso().camp === 'heros'" (click)="choisirLeCamp('heros')">Allié</button>
        </span>
        <button
          type="button"
          [class]="'spe-attitude spe-attitude--' + (perso().attitude ?? 'aucune')"
          [attr.aria-label]="'Attitude de ' + perso().nom + ' : ' + attitudeLabel()"
          [matMenuTriggerFor]="menuAttitude"
        >
          {{ attitudeLabel() }}<mat-icon aria-hidden="true">arrow_drop_down</mat-icon>
        </button>
        <mat-menu #menuAttitude="matMenu" xPosition="before">
          @for (option of attitudes; track option.value) {
            <button mat-menu-item role="menuitemradio" [attr.aria-checked]="perso().attitude === option.value" (click)="regle.emit({attitude: option.value})">
              <mat-icon>{{ option.icon }}</mat-icon>{{ option.label }}
            </button>
          }
          <button mat-menu-item role="menuitemradio" [attr.aria-checked]="perso().attitude === null" (click)="regle.emit({attitude: null})">
            <mat-icon>remove</mat-icon>Sans attitude
          </button>
        </mat-menu>
      </div>
    </div>
  `,
  styleUrl: './scene-perso.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScenePersoComponent {
  readonly perso = input.required<ScenePersonnageVue>();
  /** Il n'était pas dans la scène à l'ouverture du dialogue. */
  readonly nouveau = input(false);
  readonly regle = output<Partial<Pick<BolSceneDistributionSaisie, 'qty' | 'camp' | 'attitude'>>>();
  readonly retire = output();

  protected readonly qtyMax = QTY_MAX;
  protected readonly attitudes = ATTITUDES;
  protected readonly portrait = computed(() => aUnPortrait(this.perso().avatar));
  protected readonly attitudeLabel = computed(() => ATTITUDES.find((a) => a.value === this.perso().attitude)?.label ?? 'Sans attitude');

  protected choisirLeCamp(camp: CombatCamp): void {
    this.regle.emit({camp});
  }
}
