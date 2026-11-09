import {ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, model, output} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {pointsRecuperes} from '../../magie-combat.util';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {DwValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {heroismeGems} from '../../heroisme-spend.util';
import {HeroResourcesData, RecuperationMagique} from '../../models/hero-resources.model';
import {TableChange} from '../../models/table-change.model';
import {DwGemmesComponent} from '../../../../shared/gemmes/gemmes';

/** Les récupérations du livre : le pouvoir à midi ou minuit (1er cercle, 4 points), à la pleine lune (2e et 3e cercles, 4 points), tout
 * pour les charmes (p. 155) ; la foi, un point par heure de dévotions (p. 146). */
const RECUPERATIONS: readonly RecuperationMagique[] = [
  {ressource: 'pouvoir', libelle: 'Midi ou minuit (1er cercle)', gain: 4},
  {ressource: 'pouvoir', libelle: 'Pleine lune (2e et 3e cercles)', gain: 4},
  {ressource: 'pouvoir', libelle: 'Charmes : réserve pleine', gain: null},
  {ressource: 'foi', libelle: 'Dévotions, 1 h', gain: 1},
  {ressource: 'foi', libelle: 'Dévotions, 2 h', gain: 2},
  {ressource: 'foi', libelle: 'Dévotions, 3 h', gain: 3},
  {ressource: 'foi', libelle: 'Dévotions, 4 h', gain: 4},
];

/** Vitalité de session et héroïsme d'un héros, ajustables pas à pas et persistés à chaque pas : un cœur et sa jauge pour la vitalité,
 * une rangée de gemmes pour l'héroïsme ; pour un prêtre ou un sorcier, sa foi et son pouvoir sur leur réserve maximale, et de quoi les
 * récupérer. Utilisé dans le bandeau de la carte dépliée d’un héros (`bol-expanded-card`).
 * L'héroïsme est un `model` : le parent le partage avec le jet d'action, qui en dépense. */
@Component({
  selector: 'bol-hero-resources',
  imports: [DwGemmesComponent, DwValueStepperComponent, MatIconModule, MatMenuModule],
  template: `
    <div class="hrs-field">
      <span class="hrs-label">Vitalité · max {{ data().vitaliteMax }}</span>
      <dw-value-stepper [value]="vitalite()" (valueChange)="onVitaliteChange($event)" [min]="-20" [max]="data().vitaliteMax" [ariaLabel]="'Vitalité'" [heart]="true" />
      <span class="hrs-bar" aria-hidden="true"><i [style.width.%]="vitalitePercent()"></i></span>
    </div>
    <div class="hrs-field">
      <span class="hrs-label">Héroïsme</span>
      <div class="hrs-heroisme" role="group" aria-label="Héroïsme">
        <button type="button" class="hrs-step" aria-label="Retirer un point d’héroïsme" [disabled]="heroisme() <= 0" (click)="stepHeroisme(-1)">−</button>
        <dw-gemmes class="hrs-gems" role="img" [attr.aria-label]="heroisme() + ' points d’héroïsme'" [gems]="gems()" />
        <button type="button" class="hrs-step" aria-label="Ajouter un point d’héroïsme" (click)="stepHeroisme(1)">+</button>
      </div>
    </div>
    @if (recuperations().length) {
      <div class="hrs-field">
        <span class="hrs-label">Magie</span>
        <div class="hrs-magie">
          @if (data().foiMax !== null) {
            <span class="hrs-reserve">Foi {{ foi() }}/{{ data().foiMax }}</span>
          }
          @if (data().pouvoirMax !== null) {
            <span class="hrs-reserve">Pouvoir {{ pouvoir() }}/{{ data().pouvoirMax }}</span>
          }
          <button type="button" class="hrs-recuperer" [matMenuTriggerFor]="menuRecuperer" aria-label="Récupérer des points de foi ou de pouvoir">
            <mat-icon aria-hidden="true">restore</mat-icon>
          </button>
        </div>
        <mat-menu #menuRecuperer="matMenu">
          @for (r of recuperations(); track r.libelle) {
            <button mat-menu-item type="button" [disabled]="r.points === 0" (click)="recuperer(r)">
              {{ r.libelle }} · {{ r.points ? '+' + r.points : 'réserve pleine' }}
            </button>
          }
        </mat-menu>
      </div>
    }
  `,
  styles: `
    // Deux tuiles, du même style que les statistiques de combat de la carte : le libellé au-dessus, le stepper
    // dessous. Contrairement à elles, ces valeurs se modifient.
    :host {
      display: flex;
      gap: 0.3rem;
    }

    .hrs-field {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.1rem;
      padding: 0.2rem 0.4rem 0.25rem;
      border: 1px solid var(--dw-forge-bronze);
      border-radius: 7px;
      background: var(--dw-forge-recess);
      box-shadow: var(--dw-forge-recess-shadow);
    }

    // Cœur de la vitalité, plus petit que sur le reste de l'app : les tuiles de cet en-tête sont serrées.
    dw-value-stepper {
      --vs-heart-width: var(--hrs-heart-width, 2.1rem);
      --vs-heart-height: var(--hrs-heart-height, 1.9rem);
      --vs-heart-font: var(--hrs-heart-font, 0.8rem);
    }

    .hrs-magie {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      min-height: 1.9rem;
    }

    .hrs-reserve {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--dw-forge-bone);
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }

    .hrs-recuperer {
      display: grid;
      place-items: center;
      width: 1.6rem;
      height: 1.6rem;
      padding: 0;
      border: 1px solid var(--dw-forge-bronze-dim);
      border-radius: 50%;
      background: transparent;
      color: var(--dw-forge-hot-text);
      cursor: pointer;

      .mat-icon {
        width: 1rem;
        height: 1rem;
        font-size: 1rem;
        line-height: 1;
      }

      &:focus-visible {
        outline: 2px solid var(--dw-forge-hot);
        outline-offset: 2px;
      }
    }

    // Les boutons du stepper, partagé avec d'autres écrans : des clous de bronze ici seulement.
    dw-value-stepper {
      --vs-btn-border: var(--dw-forge-bronze-dim);
      --vs-btn-bg: var(--dw-forge-stud);
      --vs-btn-shadow: var(--dw-forge-stud-shadow);
      --vs-btn-color: var(--dw-forge-bronze-text);
    }

    // Jauge de vitalité sous le cœur : du rouge au vert, à la mesure de ce qu'il reste.
    .hrs-bar {
      align-self: stretch;
      height: 5px;
      margin-top: 0.15rem;
      border-radius: 3px;
      background: #000;
      box-shadow: 0 1px 0 rgba(255, 214, 160, 0.12);
      overflow: hidden;

      i {
        display: block;
        height: 100%;
        border-radius: 3px;
        background: linear-gradient(90deg, var(--dw-color-echec-forte), var(--dw-color-reussite));
      }
    }

    // Héroïsme : une gemme par point, allumée s'il reste à dépenser.
    .hrs-heroisme {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .hrs-gems {
      justify-content: center;
      --gem-w: 0.85rem;
      --gem-h: 1.1rem;
      --gem-gap: 0.25rem;
    }

    .hrs-step {
      flex: none;
      width: 1.5rem;
      height: 1.5rem;
      padding: 0;
      border: 1px solid var(--dw-forge-bronze-dim);
      border-radius: 50%;
      background: var(--dw-forge-stud);
      box-shadow: var(--dw-forge-stud-shadow);
      color: var(--dw-forge-bronze-text);
      font: inherit;
      font-weight: 700;
      line-height: 1;
      cursor: pointer;

      &:hover:not(:disabled) {
        border-color: var(--dw-forge-hot);
        box-shadow: var(--dw-forge-stud-glow);
        color: var(--dw-forge-hot-text);
      }

      &:focus-visible {
        outline: 2px solid var(--dw-color-legendary);
        outline-offset: 1px;
      }

      &:disabled {
        opacity: 0.35;
        cursor: default;
      }
    }

    .hrs-label {
      font-size: 0.56rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--dw-surface-600);
      white-space: nowrap;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroResourcesComponent {
  readonly data = input.required<HeroResourcesData>();
  readonly heroisme = model.required<number>();
  /** Une valeur a été persistée : le parent met la session à jour. */
  readonly changed = output<TableChange>();

  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly herosService = inject(BolHerosService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly vitalite = linkedSignal(() => this.data().vitaliteCourante);
  /** Part de vitalité restante, de 0 à 100, pour la jauge sous le cœur. */
  protected readonly vitalitePercent = computed(() => {
    const max = this.data().vitaliteMax;
    return max > 0 ? Math.max(0, Math.min(100, (this.vitalite() / max) * 100)) : 0;
  });
  protected readonly foi = linkedSignal(() => this.data().foi);
  protected readonly pouvoir = linkedSignal(() => this.data().pouvoir);

  /** Les récupérations possibles pour sa carrière, chacune avec ce qu'elle rendrait vraiment (0 : réserve déjà pleine). */
  protected readonly recuperations = computed(() => {
    const data = this.data();
    return RECUPERATIONS.flatMap((r) => {
      const max = r.ressource === 'foi' ? data.foiMax : data.pouvoirMax;
      if (max === null) {
        return [];
      }
      const courant = r.ressource === 'foi' ? this.foi() : this.pouvoir();
      return [{...r, points: pointsRecuperes(courant, max, r.gain ?? max)}];
    });
  });

  /** Une gemme par point d'héroïsme, allumée s'il reste à dépenser. */
  protected readonly gems = computed(() => heroismeGems(this.heroisme()));

  protected onVitaliteChange(value: number): void {
    const previous = this.vitalite();
    const delta = value - previous;
    if (delta === 0) {
      return;
    }

    this.vitalite.set(value);
    const data = this.data();
    this.fightSessionService.applyDamage(data.sessionId, 'hero', data.pivotId, delta).subscribe({
      // Un ajustement à la main ne propose jamais « Défier la mort » : seuls les dégâts reçus au combat le font.
      next: (session) => this.changed.emit({session}),
      error: (error: unknown) => {
        this.snackBar.open(extractApiErrorMessage(error, 'Impossible de mettre à jour la vitalité.'), 'Fermer', {
          duration: 5000,
        });
        this.vitalite.set(previous);
      },
    });
  }

  /** Rend des points de foi ou de pouvoir, sans dépasser la réserve maximale ; la fiche est mise à jour. */
  protected recuperer(r: RecuperationMagique & {readonly points: number}): void {
    if (r.points === 0) {
      return;
    }
    const valeur = r.ressource === 'foi' ? this.foi : this.pouvoir;
    const previous = valeur();
    valeur.set(previous + r.points);
    const data = this.data();
    this.herosService.adjustRessource(data.herosId, r.ressource, r.points).subscribe({
      next: (hero) => {
        valeur.set(hero.ressources[r.ressource]);
        this.snackBar.open(`${data.heroNom} récupère ${r.points} point${r.points > 1 ? 's' : ''} de ${r.ressource}.`, undefined, {duration: 4000});
      },
      error: (error: unknown) => {
        this.snackBar.open(extractApiErrorMessage(error, 'Impossible de récupérer ces points.'), 'Fermer', {duration: 5000});
        valeur.set(previous);
      },
    });
  }

  /** Un point d'héroïsme de plus ou de moins, jamais sous zéro. */
  protected stepHeroisme(delta: number): void {
    const previous = this.heroisme();
    const value = Math.max(0, previous + delta);
    if (value === previous) {
      return;
    }

    this.heroisme.set(value);
    const herosId = this.data().herosId;
    this.herosService.adjustHeroisme(herosId, value - previous).subscribe({
      next: (hero) => this.changed.emit({herosId, heroisme: hero.ressources.heroisme}),
      error: (error: unknown) => {
        this.snackBar.open(extractApiErrorMessage(error, "Impossible de mettre à jour l'héroïsme."), 'Fermer', {
          duration: 5000,
        });
        this.heroisme.set(previous);
      },
    });
  }
}
