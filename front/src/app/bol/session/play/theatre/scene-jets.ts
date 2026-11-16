import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {BolSceneJet} from '../../../models/bol-scene.model';
import {attributsEnClair, libelleDifficulte} from '../../../shared/scene-jets.util';
import {TapisCard} from '../../models/tapis.model';
import {JetLance} from '../../models/theatre.model';

/** Un jet tel que le carnet le montre : ses badges et sa ligne de détail, déjà composés. */
interface JetAffiche {
  readonly jet: BolSceneJet;
  readonly attributs: string;
  readonly difficulte: string;
  readonly detail: string;
  readonly autres: readonly string[];
}

/**
 * Les jets de la scène, dans l'onglet « Jets » du carnet : un par ligne, son titre, ses attributs et sa difficulté en badges (« Sans jet »
 * pour un effet automatique), puis l'enjeu et l'échec, et la réussite, la carrière, le moment s'ils sont écrits. « Lancer pour » propose
 * les héros de la table : en choisir un ouvre sa carte, le panneau de jet réglé sur l'attribut et la difficulté.
 */
@Component({
  selector: 'bol-scene-jets',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    <ul class="scj-liste" aria-label="Les jets de la scène">
      @for (j of affiches(); track $index) {
        <li class="scj-jet">
          <div class="scj-tete">
            <b class="scj-titre">{{ j.jet.titre }}</b>
            @if (j.attributs) {
              <span class="scj-badge scj-badge--attribut">{{ j.attributs }}</span>
              <span class="scj-badge">{{ j.difficulte }}</span>
            } @else {
              <span class="scj-badge scj-badge--sans">Sans jet</span>
            }
            @if (j.attributs && heros().length) {
              <button mat-stroked-button type="button" class="scj-lancer" [matMenuTriggerFor]="menuHeros" [matMenuTriggerData]="{jet: j.jet}">
                <mat-icon>casino</mat-icon> Lancer pour
              </button>
            }
          </div>
          @if (j.detail) {
            <p class="scj-detail">{{ j.detail }}</p>
          }
          @for (autre of j.autres; track $index) {
            <p class="scj-autre">{{ autre }}</p>
          }
        </li>
      }
    </ul>

    <mat-menu #menuHeros="matMenu">
      <ng-template matMenuContent let-jet="jet">
        @for (hero of heros(); track hero.key) {
          <button mat-menu-item type="button" (click)="lancer.emit({jet, hero})">{{ hero.nom }}</button>
        }
      </ng-template>
    </mat-menu>
  `,
  styleUrl: './scene-jets.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneJetsComponent {
  readonly jets = input.required<readonly BolSceneJet[]>();
  /** Les héros de la table ; sans eux (la lecture en grand), pas de « Lancer pour ». */
  readonly heros = input<readonly TapisCard[]>([]);
  readonly lancer = output<JetLance>();

  protected readonly affiches = computed((): JetAffiche[] =>
    this.jets().map((jet) => ({
      jet,
      attributs: attributsEnClair(jet.attributs),
      difficulte: libelleDifficulte(jet.difficulte),
      detail: [jet.enjeu, jet.echec ? `échec : ${jet.echec}` : null].filter(Boolean).join(' · '),
      autres: [
        jet.reussite ? `Réussite : ${jet.reussite}` : null,
        jet.carriere ? `Carrière : ${jet.carriere}` : null,
        jet.quand ? `Quand : ${jet.quand}` : null,
      ].filter((t): t is string => t !== null),
    })),
  );
}
