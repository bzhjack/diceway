import {ChangeDetectionStrategy, Component, computed, input, linkedSignal} from '@angular/core';
import {A11yModule} from '@angular/cdk/a11y';
import {CdkConnectedOverlay, CdkOverlayOrigin} from '@angular/cdk/overlay';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {DwPopoverDirective} from '../../../../shared/popover/popover.directive';
import {usableAvatar} from '../../../../shared/avatar-fallback/avatar.util';
import {TapisCard} from '../../models/tapis.model';
import {ATTITUDES} from '../theatre/theatre.util';
import {isLowVitalite, vitalitePercent} from './tapis.util';
import {libelleVulnerabilite} from './pouvoirs-combat.util';

/** La carte d'un combattant dans l'assistant de tour, la même pour celui qui joue et pour sa cible : à gauche son portrait, carré sur toute la hauteur, qui se fond vers la droite ;
 * à côté son rang et son attitude (et en haut à droite les boutons projetés avec `ccActions`), son nom, ses chances et sa barre de vie
 * (avec ce que le coup va lui retirer), puis ce que l'assistant y projette (chiffres, effets ; sa vie réglable en bas, avec `ccBas`). Le liseré dit son camp. */
@Component({
  selector: 'bol-combattant-carte',
  template: `
    <div class="cc-art" aria-hidden="true">
      @if (hasAvatar()) {
        <img [src]="card().avatar" alt="" (error)="avatarFailed.set(true)" />
      } @else {
        <span class="cc-initiale">{{ initiale() }}</span>
      }
    </div>
    <div class="cc-body">
      <header class="cc-head">
        <div class="cc-top">
          <span class="cc-tags">
            @if (etiquette(); as e) {
              <span class="cc-rang">{{ e }}</span>
            }
            @if (attitude(); as a) {
              <span [class]="'cc-attitude cc-attitude--' + a.value">{{ a.label }}</span>
            }
            <!-- Les pouvoirs d'un démon à garder en tête en combat (Poison, Intangible), et sa faiblesse : une icône et leur nom -->
            @for (pouvoir of avertissements(); track pouvoir) {
              <span class="cc-pouvoir" [title]="'Pouvoir à prévenir : ' + pouvoir"><mat-icon aria-hidden="true">warning</mat-icon>{{ pouvoir }}</span>
            }
            @if (vulnerabilite(); as v) {
              <!-- Sa faiblesse : une icône ; son explication, souvent longue, dans un popover au clic -->
              <button
                type="button"
                class="cc-faible"
                cdkOverlayOrigin
                #faibleOrigin="cdkOverlayOrigin"
                aria-haspopup="dialog"
                [attr.aria-expanded]="faiblesseOuverte()"
                [attr.aria-label]="v.libelle"
                [title]="v.libelle"
                (click)="faiblesseOuverte.set(!faiblesseOuverte())"
              >
                <mat-icon aria-hidden="true">heart_broken</mat-icon>
              </button>
              <ng-template
                cdkConnectedOverlay
                dwPopover="start"
                [cdkConnectedOverlayOrigin]="faibleOrigin"
                [cdkConnectedOverlayOpen]="faiblesseOuverte()"
                (backdropClick)="faiblesseOuverte.set(false)"
                (overlayKeydown)="fermerSurEchap($event, faibleOrigin)"
                (detach)="faiblesseOuverte.set(false)"
              >
                <div class="cc-faible-pop" role="dialog" aria-labelledby="cc-faible-titre" cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
                  <p id="cc-faible-titre" class="cc-faible-titre"><mat-icon aria-hidden="true">heart_broken</mat-icon> Vulnérable</p>
                  @if (v.element) {
                    <p class="cc-faible-texte">{{ v.element }}</p>
                  }
                  <!-- La règle (bestiaire, pouvoirs des démons) : le texte au-dessus dit, lui, ce qui est propre à ce démon -->
                  <p class="cc-faible-effet">Cet élément lui inflige des dégâts doublés ; une chose d'ordinaire inoffensive (lumière du jour, eau…) lui inflige des dégâts normaux.</p>
                  <button mat-stroked-button type="button" (click)="fermerFaiblesse(faibleOrigin)">Fermer</button>
                </div>
              </ng-template>
            }
          </span>
          <!-- Les boutons de la page (ouvrir la fiche, changer de cible), en haut à droite -->
          <ng-content select="[ccActions]" />
        </div>
        <p class="cc-titre">
          <b class="cc-nom">{{ card().nom }}</b>
          @if (chance(); as c) {
            <em class="cc-chance">{{ c }}</em>
          }
        </p>
        <span class="cc-vie" [class.cc-vie--bas]="low()" aria-hidden="true"><i [style.width.%]="rest()"></i><u [style.left.%]="rest()" [style.width.%]="loss()"></u></span>
      </header>
      <ng-content />
    </div>
    <!-- Ce qui se règle, sous le portrait et le texte -->
    <ng-content select="[ccBas]" />
  `,
  imports: [MatIconModule, MatButtonModule, CdkConnectedOverlay, CdkOverlayOrigin, A11yModule, DwPopoverDirective],
  styleUrl: './combattant-carte.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.cc--ligne]': 'ligne()',
    '[class.cc--allie]': "card().camp === 'heros'",
    '[class.cc--tombe]': 'tombe()',
  },
})
export class CombattantCarteComponent {
  readonly card = input.required<TapisCard>();
  /** Pour une cible, ses chances d'être touchée (« 8+ · 42 % ») ; `null` sans. */
  readonly chance = input<string | null>(null);
  /** Pour une cible, les points de vie que le coup en cours va lui retirer, montrés sur sa barre. */
  readonly perte = input(0);
  /** Celui qui joue : tout sur une ligne, en plaque de fer ; ce que la page y projette se range par zones (`combattant-carte.scss`). */
  readonly ligne = input(false);

  /** Le portrait n'a pas pu se charger : repli sur l'initiale (à nouveau tenté pour une autre carte). */
  protected readonly avatarFailed = linkedSignal({source: () => this.card().key, computation: () => false});
  protected readonly hasAvatar = computed(() => usableAvatar(this.card().avatar) !== null && !this.avatarFailed());
  /** Sans portrait, son initiale. */
  protected readonly initiale = computed(() => this.card().nom.trim().charAt(0).toUpperCase());
  /** L'étiquette du coin : son rang, ou « Héros » pour un héros. */
  protected readonly etiquette = computed(() => this.card().rang ?? (this.card().kind === 'hero' ? 'Héros' : null));
  /** Son attitude envers les héros, pour un personnage du camp d'en face. */
  protected readonly attitude = computed(() => {
    const card = this.card();
    return card.camp === 'adversaires' ? (ATTITUDES.find((a) => a.value === card.attitude) ?? null) : null;
  });
  /** Les pouvoirs d'un démon à prévenir en combat (`avertissement_combat`). */
  protected readonly avertissements = computed(() => this.card().pouvoirs?.avertissements ?? []);
  /** La faiblesse d'un démon vulnérable : son libellé entier (« Vulnérable : feu (dégâts doublés) »), et ce que le popover explique. */
  protected readonly vulnerabilite = computed(() => {
    const v = this.card().pouvoirs?.vulnerabilite;
    if (!v) {
      return null;
    }
    const element = v.element ? `${v.element.charAt(0).toUpperCase()}${v.element.slice(1)}` : null;
    return {libelle: libelleVulnerabilite(v), element};
  });
  /** Le popover de la faiblesse, ouvert au clic sur son icône. */
  protected readonly faiblesseOuverte = linkedSignal({source: () => this.card().key, computation: () => false});
  private readonly percent = computed(() => vitalitePercent(this.card().vitaliteCourante, this.card().vitaliteMax));
  protected readonly loss = computed(() => {
    const max = this.card().vitaliteMax ?? 0;
    return max > 0 ? Math.min(this.percent(), (this.perte() / max) * 100) : 0;
  });
  protected readonly rest = computed(() => this.percent() - this.loss());
  protected readonly low = computed(() => isLowVitalite(this.card().vitaliteCourante, this.card().vitaliteMax));
  protected readonly tombe = computed(() => {
    const vitalite = this.card().vitaliteCourante;
    return vitalite !== null && this.card().vitaliteMax !== null && vitalite <= 0;
  });

  /** Ferme le popover de la faiblesse et rend la main à son icône. */
  protected fermerFaiblesse(origine: CdkOverlayOrigin): void {
    this.faiblesseOuverte.set(false);
    (origine.elementRef.nativeElement as HTMLElement).focus();
  }

  protected fermerSurEchap(event: KeyboardEvent, origine: CdkOverlayOrigin): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.fermerFaiblesse(origine);
    }
  }
}
