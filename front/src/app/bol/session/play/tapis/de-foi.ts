import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatTooltipModule} from '@angular/material/tooltip';
import {DwValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';
import {SensDeFoi} from '../../models/magie-combat.model';
import {TapisCard} from '../../models/tapis.model';

/** Ce que le prêtre accorde ou impose : à qui, et quel dé. */
interface DonDeFoi {
  readonly porteur: TapisCard;
  readonly sens: SensDeFoi;
}

/** La foi d'un prêtre ou d'un druide à la table (livre p. 146) : ses points, qui se corrigent ici, et « Dé de foi » — pour 1 point, sans
 * jet, un dé de bonus ou de malus à la prochaine action d'un être qu'il voit (lui compris). Les menus proposent d'abord ceux qu'un dé
 * de bonus aide (lui, puis son camp) ou qu'un dé de malus gêne (le camp d'en face). Il annonce le choix (`donne`) : l'assistant pose le
 * dé et décompte le point. */
@Component({
  selector: 'bol-de-foi',
  imports: [MatIconModule, MatMenuModule, MatTooltipModule, DwValueStepperComponent],
  template: `
    <span class="dfo-row">
      <dw-value-stepper [value]="foi()" (valueChange)="stepped.emit($event - foi())" [min]="0" [ariaLabel]="'Points de foi de ' + pretre().nom" />
      <!-- Fermé par un verrou, il reste focalisable (aria-disabled, que le menu respecte) : son infobulle dit pourquoi. -->
      <button
        type="button"
        class="dfo-btn"
        [disabled]="foi() <= 0"
        [attr.aria-disabled]="verrou() !== null || null"
        [matMenuTriggerFor]="choix"
        [attr.aria-label]="verrou() === null ? 'Dé de foi' : 'Dé de foi. ' + verrou()"
        [matTooltip]="aide()"
      >
        <mat-icon aria-hidden="true">wb_sunny</mat-icon>
      </button>
    </span>
    <span class="tas-tag">Foi</span>

    <mat-menu #choix="matMenu" class="tas-scope dfo-menu">
      <button mat-menu-item type="button" [matMenuTriggerFor]="bonus">Dé de bonus à…</button>
      <button mat-menu-item type="button" [matMenuTriggerFor]="malus">Dé de malus à…</button>
    </mat-menu>
    <mat-menu #bonus="matMenu" class="tas-scope dfo-menu">
      @for (c of pourUnBonus(); track c.key) {
        <button mat-menu-item type="button" (click)="donne.emit({porteur: c, sens: 'bonus'})">{{ nomDe(c) }}</button>
      }
    </mat-menu>
    <mat-menu #malus="matMenu" class="tas-scope dfo-menu">
      @for (c of pourUnMalus(); track c.key) {
        <button mat-menu-item type="button" (click)="donne.emit({porteur: c, sens: 'malus'})">{{ nomDe(c) }}</button>
      }
    </mat-menu>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.15rem;
    }

    .dfo-row {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
    }

    .dfo-btn {
      display: inline-grid;
      place-items: center;
      width: 1.9rem;
      height: 1.9rem;
      padding: 0;
      border: 1px solid var(--dw-forge-bronze-dim);
      border-radius: 50%;
      background: var(--dw-forge-stud);
      box-shadow: var(--dw-forge-stud-shadow);
      color: var(--dw-color-foi);
      cursor: pointer;

      mat-icon {
        width: 1.15rem;
        height: 1.15rem;
      }

      &:hover:not(:disabled, [aria-disabled='true']) {
        border-color: var(--dw-color-foi);
        box-shadow: var(--dw-forge-stud-glow);
      }

      &:focus-visible {
        outline: 2px solid var(--dw-color-legendary);
        outline-offset: 1px;
      }

      &:disabled,
      &[aria-disabled='true'] {
        opacity: 0.4;
        cursor: default;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeFoiComponent {
  /** Le prêtre ou le druide. */
  readonly pretre = input.required<TapisCard>();
  readonly foi = input.required<number>();
  /** Les êtres qu'il voit, des deux camps. */
  readonly visibles = input<readonly TapisCard[]>([]);
  /** Pourquoi le dé de foi ne se donne pas maintenant (le jet qu'il viserait est déjà fait) ; `null` s'il se donne. */
  readonly verrou = input<string | null>(null);
  /** Une correction de ses points à la main : −1 ou +1. */
  readonly stepped = output<number>();
  readonly donne = output<DonDeFoi>();

  protected readonly aide = computed(() => {
    if (this.foi() <= 0) {
      return 'Plus de foi : il faut retourner au temple';
    }
    return this.verrou() ?? 'Dé de foi : 1 point, sans jet, un dé de bonus ou de malus à la prochaine action d’un être visible';
  });

  /** Avec lui, même s'il n'est plus dans la liste (une carte à 0 peut encore prier). */
  private readonly tous = computed(() => {
    const visibles = this.visibles();
    return visibles.some((c) => c.key === this.pretre().key) ? visibles : [this.pretre(), ...visibles];
  });

  /** Lui, puis son camp, puis le camp d'en face. */
  protected readonly pourUnBonus = computed(() => {
    const pretre = this.pretre();
    const tous = this.tous();
    return [pretre, ...tous.filter((c) => c.key !== pretre.key && c.camp === pretre.camp), ...tous.filter((c) => c.camp !== pretre.camp)];
  });

  /** Le camp d'en face, puis son camp, puis lui. */
  protected readonly pourUnMalus = computed(() => [...this.pourUnBonus()].reverse());

  protected nomDe(card: TapisCard): string {
    return card.key === this.pretre().key ? `${card.nom} (lui-même)` : card.nom;
  }
}
