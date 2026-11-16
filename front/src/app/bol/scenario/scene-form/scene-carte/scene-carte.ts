import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {AvatarFallbackDirective} from '../../../../shared/avatar-fallback/avatar-fallback.directive';
import {BolSceneDistributionSaisie} from '../../../models/bol-scene.model';
import {AttitudeMenuComponent} from '../../../shared/attitude/attitude-menu';
import {RangComponent} from '../../../shared/rang/rang';
import {ScenePersonnageVue} from '../../models/scene-form.model';
import {PersoReglagesComponent} from '../perso-reglages/perso-reglages';
import {aUnPortrait} from '../scene-form.util';

/**
 * Un personnage de « La distribution » de « Préparer la scène », en carte portrait : son nombre en médaille, son nom (sur une ligne) et
 * la pastille de son attitude calée à droite (`bol-attitude-menu` : son nom en infobulle, un clic ouvre son menu), son rang, son type et
 * sa vitalité ; en bas, sur une bande à la couleur de son camp, ses réglages (`bol-perso-reglages` : un de moins, un de plus, Adversaire
 * ou Allié) ; × le retire. Ne fait que dire le réglage (`regle`) ou le retrait (`retire`).
 */
@Component({
  selector: 'bol-scene-carte',
  imports: [AttitudeMenuComponent, AvatarFallbackDirective, MatIconModule, PersoReglagesComponent, RangComponent],
  template: `
    <article class="sca" [class.sca--allie]="perso().camp === 'heros'" [class.sca--introuvable]="perso().introuvable">
      <div class="sca-haut">
        <span class="sca-portrait">
          @if (portrait()) {
            <img dwAvatarFallback [src]="perso().avatar" alt="" />
          } @else {
            <span class="sca-initiale" aria-hidden="true">{{ perso().nom.charAt(0) }}</span>
          }
        </span>
        <span class="sca-corps">
          <span class="sca-nom">
            <span class="sca-nom-texte">{{ perso().nom }}</span>
            <bol-attitude-menu class="sca-attitude" [attitude]="perso().attitude" [nom]="perso().nom" (choisie)="regle.emit({attitude: $event})" />
          </span>
          <span class="sr-only">, {{ perso().qty }} exemplaire{{ perso().qty > 1 ? 's' : '' }}</span>
          <span class="sca-detail">
            @if (perso().rang; as rang) {
              <bol-rang [rang]="rang" />
            }
            {{ perso().type }}{{ perso().vitalite === null ? '' : ' · ' + perso().vitalite + ' PV' }}
          </span>
        </span>
      </div>
      <bol-perso-reglages class="sca-bande" [nom]="perso().nom" [qty]="perso().qty" [camp]="perso().camp" (regle)="regle.emit($event)" />
      <span class="sca-nombre" aria-hidden="true">×{{ perso().qty }}</span>
      <button type="button" class="sca-retirer" [attr.aria-label]="'Retirer ' + perso().nom" (click)="retire.emit()">
        <mat-icon>close</mat-icon>
      </button>
    </article>
  `,
  styleUrl: './scene-carte.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneCarteComponent {
  readonly perso = input.required<ScenePersonnageVue>();
  readonly regle = output<Partial<Pick<BolSceneDistributionSaisie, 'qty' | 'camp' | 'attitude'>>>();
  readonly retire = output();

  protected readonly portrait = computed(() => aUnPortrait(this.perso().avatar));
}
