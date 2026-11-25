import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatTooltipModule} from '@angular/material/tooltip';
import {DwArmeIconComponent} from '../../../shared/arme/arme-icon';
import {TapisCard} from '../../models/tapis.model';
import {PostureChoice} from '../../models/turn-assistant.model';
import {TasSortFormComponent} from './tas-sort-form';
import {postureEnClair, postureEnPhrase} from './tas-phrase.util';
import {TurnAttackStore} from './turn-attack.store';
import {TurnCibleStore} from './turn-cible.store';
import {TurnContextStore} from './turn-context.store';
import {TurnFlowStore} from './turn-flow.store';
import {TurnLoadoutStore} from './turn-loadout.store';

/**
 * Le coup se prépare comme une phrase qu'on lit : « Kaja de Parsool attaque Drajit avec Hache d'abordage, sans posture ». Chaque mot en or se
 * change d'un clic, son menu disant en clair ce que fait chaque choix ; ce qui est déjà réglé l'est par défaut. Dessous, les précisions,
 * seulement quand elles servent : la manœuvre, la carrière, le combat à deux armes, la horde, la portée… Le coup joué, la phrase se fige.
 */
@Component({
  selector: 'bol-tas-phrase',
  imports: [DwArmeIconComponent, MatIconModule, MatMenuModule, MatTooltipModule, TasSortFormComponent],
  templateUrl: './tas-phrase.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasPhraseComponent {
  protected readonly turn = inject(TurnContextStore);
  protected readonly loadout = inject(TurnLoadoutStore);
  protected readonly attack = inject(TurnAttackStore);
  protected readonly cible = inject(TurnCibleStore);
  protected readonly flow = inject(TurnFlowStore);

  /** Ce qu'il fait de son tour, en un verbe. */
  protected readonly action = computed(() => (this.loadout.defenseTotale() ? 'se met en défense totale' : this.loadout.sortMode() ? 'lance un sort' : 'attaque'));
  /** Une échelle de postures (un héros, un PNJ) ; une créature ou un démon attaque, ou se défend. */
  protected readonly echelle = computed(() => this.loadout.postureChoices().length > 2);
  protected readonly postures = computed(() => this.loadout.postureChoices().filter((c) => c.attaque !== null));
  protected readonly posture = computed(() => postureEnPhrase(this.loadout.postureChoices().find((c) => c.slug === this.loadout.posturePressed())));
  /** La manœuvre retenue (hors combat à deux armes, réglé à part). */
  protected readonly manoeuvre = computed(() => {
    const special = this.loadout.effectiveSpecial();
    return special && this.loadout.manoeuvres().some((m) => m.slug === special.slug) ? special : null;
  });
  protected readonly enClair = postureEnClair;
  /** Le mode du combat à deux armes retenu, en clair ; `null` : une seule arme. */
  protected readonly deuxArmes = computed(() =>
    this.loadout.isDualWieldSelected() ? (this.loadout.dualChoices().find((o) => o.slug === this.loadout.effectiveSpecial()?.slug)?.name ?? null) : null,
  );

  /** Les cibles du menu, une ligne par carte : « Garde #2 · 7+ · 58 % ». */
  protected readonly cibles = computed(() =>
    this.cible.targetGroups().flatMap((g) =>
      g.members.map((m) => ({card: m.card, nom: g.members.length > 1 ? `${g.nom} #${m.num}` : g.nom, odds: m.odds ?? g.odds, foe: g.foe})),
    ),
  );

  protected choisirCible(card: TapisCard): void {
    if (this.turn.target()?.key !== card.key) {
      this.cible.selectTarget(card);
    }
  }

  protected attaquer(): void {
    if (this.loadout.sortMode()) {
      this.loadout.setMode('attaque');
    }
    if (this.loadout.defenseTotale()) {
      this.loadout.selectOption('none');
    }
  }

  protected lancerUnSort(): void {
    if (this.loadout.defenseTotale()) {
      this.loadout.selectOption('none');
    }
    this.loadout.setMode('sort');
  }

  protected choisirPosture(choix: PostureChoice): void {
    this.loadout.selectOption(choix.slug);
  }

  /** Plus de manœuvre : la cochée se décoche. */
  protected sansManoeuvre(): void {
    const m = this.manoeuvre();
    if (m) {
      this.loadout.toggleSpecial(m.slug);
    }
  }

  protected choisirManoeuvre(slug: string): void {
    if (this.manoeuvre()?.slug !== slug) {
      this.loadout.toggleSpecial(slug);
    }
  }

  protected choisirCarriere(label: string | null): void {
    const actuelle = this.loadout.career()?.label ?? null;
    if (label === null && actuelle !== null) {
      this.loadout.toggleCareer(actuelle);
    } else if (label !== null && label !== actuelle) {
      this.loadout.toggleCareer(label);
    }
  }
}
