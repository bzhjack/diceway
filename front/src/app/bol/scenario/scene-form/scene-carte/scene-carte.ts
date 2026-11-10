import {A11yModule} from '@angular/cdk/a11y';
import {OverlayModule} from '@angular/cdk/overlay';
import {ChangeDetectionStrategy, Component, computed, input, output, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatButtonToggleChange, MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatIconModule} from '@angular/material/icon';
import {AvatarFallbackDirective} from '../../../../shared/avatar-fallback/avatar-fallback.directive';
import {DwPopoverDirective} from '../../../../shared/popover/popover.directive';
import {DwValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';
import {CombatantAttitude, CombatCamp} from '../../../models/bol-fight-session.model';
import {BolSceneDistributionSaisie} from '../../../models/bol-scene.model';
import {AttitudeChoixComponent} from '../../../shared/attitude/attitude-choix';
import {RANG_LABELS} from '../../../shared/library/library-rows-page.base';
import {ATTITUDES} from '../../../session/play/theatre/theatre.util';
import {ScenePersonnageVue} from '../../models/scene-form.model';
import {aUnPortrait, QTY_MAX} from '../scene-form.util';

let suivant = 0;

/**
 * Un personnage de « La distribution » de « Préparer la scène », en carte portrait : son nombre en médaille, son nom, son rang, son type
 * et sa vitalité ; en bas, une bande à la couleur de son camp dit son camp et son attitude. Un clic sur la carte ouvre ses réglages
 * (nombre, camp, attitude) dans un popover ; × le retire. Ne fait que dire le réglage (`regle`) ou le retrait (`retire`).
 */
@Component({
  selector: 'bol-scene-carte',
  imports: [
    A11yModule,
    AttitudeChoixComponent,
    AvatarFallbackDirective,
    DwPopoverDirective,
    DwValueStepperComponent,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    OverlayModule,
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
          <span class="sr-only">Régler</span>
          <span class="sca-nom">{{ perso().nom }}</span>
          <span class="sr-only">, {{ perso().qty }} exemplaire{{ perso().qty > 1 ? 's' : '' }}</span>
          <span class="sca-detail">
            @if (perso().rang; as rang) {
              <span class="dw-lr-rang" [class]="'dw-lr-rang--' + rang">{{ rangLabels[rang] }}</span>
            }
            {{ perso().type }}{{ perso().vitalite === null ? '' : ' · ' + perso().vitalite + ' PV' }}
          </span>
        </span>
        <span class="sca-bande">
          <span>{{ perso().camp === 'heros' ? 'Allié' : 'Adversaire' }}</span>
          <span class="sca-attitude">{{ attitudeLabel() }}<mat-icon aria-hidden="true">tune</mat-icon></span>
        </span>
      </button>
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
        <div class="sca-pop" role="dialog" [attr.aria-label]="'Régler ' + perso().nom" cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
          <p class="sca-pop-titre">{{ perso().nom }}</p>
          <span class="sca-pop-label">Nombre</span>
          <dw-value-stepper [value]="perso().qty" [min]="1" [max]="qtyMax" [ariaLabel]="'Nombre de ' + perso().nom" (valueChange)="regle.emit({qty: $event})" />
          <span class="sca-pop-label" [id]="'sca-camp-' + uid">Camp</span>
          <mat-button-toggle-group
            class="sca-pop-camp"
            [attr.aria-labelledby]="'sca-camp-' + uid"
            [hideSingleSelectionIndicator]="true"
            [value]="perso().camp"
            (change)="choisirLeCamp($event)"
          >
            <mat-button-toggle value="adversaires">Adversaire</mat-button-toggle>
            <mat-button-toggle value="heros">Allié</mat-button-toggle>
          </mat-button-toggle-group>
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
  protected readonly qtyMax = QTY_MAX;
  protected readonly rangLabels = RANG_LABELS;
  protected readonly portrait = computed(() => aUnPortrait(this.perso().avatar));
  protected readonly attitudeLabel = computed(() => ATTITUDES.find((a) => a.value === this.perso().attitude)?.label ?? 'Sans attitude');

  protected touche(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.ouvert.set(false);
    }
  }

  protected choisirLeCamp(change: MatButtonToggleChange): void {
    this.regle.emit({camp: change.value as CombatCamp});
  }

  protected choisirLAttitude(attitude: CombatantAttitude | null): void {
    this.regle.emit({attitude});
  }
}
