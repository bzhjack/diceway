import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {RouterLink} from '@angular/router';
import {AvatarFallbackDirective} from '../../../shared/avatar-fallback/avatar-fallback.directive';
import {AccueilHerosCarte} from '../../session/models/accueil.model';

/**
 * Une compagnie en bref : son nom, puis ses héros en médaillons qui se chevauchent (portrait, sinon initiale) et leurs noms en toutes
 * lettres (« Dogon, bogomit et Conan »). Dans « Nouvelle partie » et sur la dernière partie de l'accueil ; là, chaque nom mène à la fiche
 * de son héros (`liens`) et l'ensemble est plus grand (`grand`).
 */
@Component({
  selector: 'bol-compagnie-equipe',
  imports: [RouterLink, AvatarFallbackDirective],
  template: `
    <span class="ceq-nom">{{ nom() }}</span>
    <span class="ceq-heros">
      @if (heros().length) {
        <span class="ceq-medaillons" aria-hidden="true">
          @for (h of heros(); track h.id) {
            @if (h.portrait; as portrait) {
              <img dwAvatarFallback [src]="portrait" alt="" />
            } @else {
              <span class="ceq-initiale">{{ h.initiale }}</span>
            }
          }
        </span>
      }
      <span class="ceq-noms">
        @for (h of noms(); track h.id) {
          @if (h.avant) {
            <span>{{ h.avant }}</span>
          }
          @if (liens()) {
            <a class="ceq-lien" [routerLink]="['/create/hero', h.id]">{{ h.nom }}</a>
          } @else {
            <span>{{ h.nom }}</span>
          }
        } @empty {
          <span>Aucun héros</span>
        }
      </span>
    </span>
  `,
  styleUrl: './compagnie-equipe.scss',
  host: {'[class.ceq--grand]': 'grand()'},
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompagnieEquipeComponent {
  readonly nom = input.required<string>();
  readonly heros = input.required<readonly AccueilHerosCarte[]>();
  /** Chaque nom de héros mène à sa fiche. */
  readonly liens = input(false);
  /** Plus grand, sur l'illustration de la dernière partie. */
  readonly grand = input(false);

  /** Les héros avec ce qui précède leur nom : rien, « , » ou « et ». */
  protected readonly noms = computed(() =>
    this.heros().map((h, i, tous) => ({id: h.id, nom: h.nom, avant: i === 0 ? '' : i === tous.length - 1 ? ' et ' : ', '})),
  );
}
