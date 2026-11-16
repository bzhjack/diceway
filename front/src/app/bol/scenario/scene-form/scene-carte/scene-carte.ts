import {A11yModule} from '@angular/cdk/a11y';
import {OverlayModule} from '@angular/cdk/overlay';
import {ChangeDetectionStrategy, Component, computed, input, output, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {AvatarFallbackDirective} from '../../../../shared/avatar-fallback/avatar-fallback.directive';
import {DwPopoverDirective} from '../../../../shared/popover/popover.directive';
import {CombatantAttitude} from '../../../models/bol-fight-session.model';
import {BolSceneDistributionSaisie} from '../../../models/bol-scene.model';
import {AttitudePuceComponent} from '../../../shared/attitude/attitude-puce';
import {AttitudeChoixComponent} from '../../../shared/attitude/attitude-choix';
import {RangComponent} from '../../../shared/rang/rang';
import {ATTITUDES} from '../../../session/play/theatre/theatre.util';
import {ScenePersonnageVue} from '../../models/scene-form.model';
import {PersoReglagesComponent} from '../perso-reglages/perso-reglages';
import {aUnPortrait} from '../scene-form.util';

let suivant = 0;

/**
 * Un personnage de « La distribution » de « Préparer la scène », en carte portrait : son nombre en médaille, son nom (sur une ligne) et
 * la pastille de son attitude calée à droite (son nom en infobulle), son rang, son type et sa vitalité ; en bas, sur une bande à la
 * couleur de son camp, ses réglages (`bol-perso-reglages` : un de moins, un de plus, Adversaire ou Allié). Un clic sur la carte ouvre son
 * attitude dans un popover ; × le retire. Ne fait que dire le réglage (`regle`) ou le retrait (`retire`).
 */
@Component({
  selector: 'bol-scene-carte',
  imports: [
    AttitudePuceComponent,
    RangComponent,
    A11yModule,
    AttitudeChoixComponent,
    AvatarFallbackDirective,
    DwPopoverDirective,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    OverlayModule,
    PersoReglagesComponent,
  ],
  template: `
    <article class="sca" [class.sca--allie]="perso().camp === 'heros'" [class.sca--introuvable]="perso().introuvable">
      <button
        type="button"
        class="sca-regler"
        cdkOverlayOrigin
        #origine="cdkOverlayOrigin"
        aria-haspopup="dialog"
        [attr.aria-expanded]="ouvert()"
        (click)="ouvert.set(true)"
      >
        <span class="sca-portrait">
          @if (portrait()) {
            <img dwAvatarFallback [src]="perso().avatar" alt="" />
          } @else {
            <span class="sca-initiale" aria-hidden="true">{{ perso().nom.charAt(0) }}</span>
          }
        </span>
        <span class="sca-corps">
          <span class="sr-only">Attitude de</span>
          <span class="sca-nom">
            <span class="sca-nom-texte">{{ perso().nom }}</span>
            <bol-attitude-puce class="sca-puce" [attitude]="perso().attitude" [matTooltip]="attitudeLabel()" matTooltipPosition="above" />
          </span>
          <span class="sr-only">, {{ attitudeLabel() }}, {{ perso().qty }} exemplaire{{ perso().qty > 1 ? 's' : '' }}</span>
          <span class="sca-detail">
            @if (perso().rang; as rang) {
              <bol-rang [rang]="rang" />
            }
            {{ perso().type }}{{ perso().vitalite === null ? '' : ' · ' + perso().vitalite + ' PV' }}
          </span>
        </span>
      </button>
      <bol-perso-reglages class="sca-bande" [nom]="perso().nom" [qty]="perso().qty" [camp]="perso().camp" (regle)="regle.emit($event)" />
      <span class="sca-nombre" aria-hidden="true">×{{ perso().qty }}</span>
      <button type="button" class="sca-retirer" [attr.aria-label]="'Retirer ' + perso().nom" (click)="retire.emit()">
        <mat-icon>close</mat-icon>
      </button>

      <ng-template
        cdkConnectedOverlay
        dwPopover="start"
        [cdkConnectedOverlayOrigin]="origine"
        [cdkConnectedOverlayOpen]="ouvert()"
        (backdropClick)="ouvert.set(false)"
        (overlayKeydown)="touche($event)"
        (detach)="ouvert.set(false)"
      >
        <div class="sca-pop" role="dialog" [attr.aria-label]="'Attitude de ' + perso().nom" cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
          <p class="sca-pop-titre">{{ perso().nom }}</p>
          <span class="sca-pop-label" [id]="'sca-attitude-' + uid">Attitude</span>
          <bol-attitude-choix [labelledBy]="'sca-attitude-' + uid" [attitude]="perso().attitude" (choisie)="choisirLAttitude($event)" />
        </div>
      </ng-template>
    </article>
  `,
  styleUrl: './scene-carte.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneCarteComponent {
  readonly perso = input.required<ScenePersonnageVue>();
  readonly regle = output<Partial<Pick<BolSceneDistributionSaisie, 'qty' | 'camp' | 'attitude'>>>();
  readonly retire = output();

  protected readonly ouvert = signal(false);
  protected readonly uid = ++suivant;
  protected readonly portrait = computed(() => aUnPortrait(this.perso().avatar));
  protected readonly attitudeLabel = computed(() => ATTITUDES.find((a) => a.value === this.perso().attitude)?.label ?? 'Sans attitude');

  protected touche(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.ouvert.set(false);
    }
  }

  protected choisirLAttitude(attitude: CombatantAttitude | null): void {
    this.regle.emit({attitude});
  }
}
