import {ChangeDetectionStrategy, Component, computed, inject, input, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {RouterLink} from '@angular/router';
import {BolStatblockData, BolStatblockTile} from '../models/bol-statblock.model';

type SheetKind = 'hero' | 'pnj' | 'creature' | 'demon';

const KIND_LABEL: Record<SheetKind, string> = {hero: 'Héros', pnj: 'PNJ', creature: 'Créature', demon: 'Démon'};
const KIND_ICON: Record<SheetKind, string> = {hero: 'person', pnj: 'person', creature: 'pets', demon: 'whatshot'};

/** Fiche d'un personnage BoL : une colonne d'identité (médaillon, nom, rang, vitalité en cœur) et, à droite, des
 * cartes — attributs, combat, puis les listes (carrières, traits, armes, armures, capacités…). Sert aux
 * bibliothèques (dialogue du statbloc) et à la carte d'un PNJ, d'une créature ou d'un démon sur la table : celle-ci
 * y projette son stepper de vitalité (`sheetSide`), ses boutons (`sheetActions`) et « Attaquer » (`sheetFooter`). */
@Component({
  selector: 'bol-statblock',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, RouterLink],
  templateUrl: './bol-statblock.component.html',
  styleUrl: './bol-statblock.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {'[class]': "'bs--' + sheetKind()", '[class.bs--bare]': 'bare()'},
})
export class BolStatblockComponent {
  readonly data = input.required<BolStatblockData>();
  readonly imageSrc = input.required<string>();
  /** Page à laquelle revenir après édition (ex. la session de combat en cours) — `null` si sans objet. */
  readonly returnUrl = input<string | null>(null);
  /** Type du personnage (couleur du métal) ; à défaut, déduit de l'accent du statbloc. */
  readonly kind = input<SheetKind | null>(null);
  /** Nom affiché ; à défaut, le titre du statbloc. */
  readonly name = input<string | null>(null);
  /** Sous-titre ; à défaut, le type du personnage. */
  readonly subtitle = input<string | null>(null);
  /** Montre la vitalité du statbloc en cœur fixe — l'appelant la remplace par son stepper (`sheetSide`). */
  readonly showVitality = input(true);
  /** Bouton de fermeture quand la fiche est dans un dialogue — l'appelant peut fournir les siens (`sheetActions`). */
  readonly showClose = input(true);
  /** Sans cadre ni fond : la fiche est posée dans un conteneur qui les porte déjà. */
  readonly bare = input(false);

  protected readonly dialogRef = inject(MatDialogRef, {optional: true});
  private readonly avatarFailed = signal(false);

  protected readonly sheetKind = computed<SheetKind>(() => {
    const kind = this.kind();
    if (kind) {
      return kind;
    }
    const accent = this.data().accent;
    return accent === 'amber' ? 'creature' : accent === 'rose' ? 'demon' : 'pnj';
  });
  protected readonly displayName = computed(() => this.name() ?? this.data().title);
  protected readonly displaySubtitle = computed(() => this.subtitle() ?? KIND_LABEL[this.sheetKind()]);
  protected readonly hasAvatar = computed(() => !!this.imageSrc() && !this.avatarFailed());
  protected readonly kindIcon = computed(() => KIND_ICON[this.sheetKind()]);

  /** Vitalité du statbloc, pour le cœur fixe. */
  protected readonly vitality = computed(() => this.data().vitals.find((tile) => tile.tone === 'health') ?? null);

  /** Les tuiles se partagent en deux moitiés : les attributs, puis les statistiques de combat. */
  protected readonly attributTiles = computed(() => this.half(true));
  /** Combat : la seconde moitié des tuiles, plus protection et dégâts (un PNJ les a déjà dans ses armes et armures). */
  protected readonly combatTiles = computed<readonly BolStatblockTile[]>(() => {
    const extra = this.sheetKind() === 'pnj' ? [] : this.data().vitals.filter((tile) => tile.tone !== 'health');
    return [...this.half(false), ...extra];
  });

  protected navigationState(): Record<string, string> | undefined {
    const returnUrl = this.returnUrl();
    return returnUrl ? {returnUrl} : undefined;
  }

  protected onAvatarError(): void {
    this.avatarFailed.set(true);
  }

  private half(first: boolean): readonly BolStatblockTile[] {
    const tiles = this.data().tiles;
    const cut = Math.ceil(tiles.length / 2);
    return first ? tiles.slice(0, cut) : tiles.slice(cut);
  }
}
