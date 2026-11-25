import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {AttitudeMenuComponent} from '../../../shared/attitude/attitude-menu';
import {AvatarFallbackDirective} from '../../../../shared/avatar-fallback/avatar-fallback.directive';
import {BolSceneDistributionSaisie} from '../../../models/bol-scene.model';
import {ScenePersonnageVue} from '../../models/scene-form.model';
import {PersoReglagesComponent} from '../perso-reglages/perso-reglages';
import {aUnPortrait} from '../scene-form.util';

/**
 * Un personnage de la distribution d'« Ajouter des personnages », en petit : son portrait et son nombre, son nom suivi de la pastille de
 * son attitude (`bol-attitude-menu` : son nom en infobulle, un clic ouvre son menu), de quoi le retirer ; dessous, ses réglages (`bol-perso-reglages`) : un de
 * plus ou de moins, et son camp calé à droite. Le liseré dit le camp. Ne fait que dire le réglage (`regle`) ou le retrait (`retire`).
 */
@Component({
  selector: 'bol-scene-perso',
  imports: [AttitudeMenuComponent, AvatarFallbackDirective, MatButtonModule, MatIconModule, PersoReglagesComponent],
  template: `
    <div class="spe" [class.spe--allie]="perso().camp === 'heros'" [class.spe--introuvable]="perso().introuvable" [class.spe--nouveau]="nouveau()">
      <span class="spe-portrait">
        @if (portrait()) {
          <img dwAvatarFallback [src]="perso().avatar" alt="" />
        } @else {
          <span class="spe-initiale" aria-hidden="true">{{ perso().nom.charAt(0) }}</span>
        }
        @if (perso().kind !== 'hero') {
          <span class="spe-nombre">{{ perso().qty }}</span>
        }
      </span>
      <span class="spe-nom">
        <span class="spe-texte">{{ perso().nom }}</span>
        @if (perso().kind !== 'hero') {
          <bol-attitude-menu [attitude]="perso().attitude" [nom]="perso().nom" (choisie)="regle.emit({attitude: $event})" />
        }
        @if (nouveau()) {
          <span class="spe-nouveau">nouveau</span>
        }
      </span>
      <button mat-icon-button type="button" class="spe-retirer" [attr.aria-label]="'Retirer ' + perso().nom" (click)="retire.emit()">
        <mat-icon>close</mat-icon>
      </button>

      <!-- Un héros entre seul, dans son camp, sans attitude : rien à régler. -->
      @if (perso().kind === 'hero') {
        <span class="spe-heros">Héros · rejoint la compagnie</span>
      } @else {
        <bol-perso-reglages class="spe-reglages" [nom]="perso().nom" [qty]="perso().qty" [camp]="perso().camp" (regle)="regle.emit($event)" />
      }
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

  protected readonly portrait = computed(() => aUnPortrait(this.perso().avatar));
}
