import {ChangeDetectionStrategy, Component, computed, inject, input, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {NavigationStart, Router, RouterLink} from '@angular/router';
import {filter} from 'rxjs';
import {openImageDialog} from '../../../shared/dw-image-dialog/dw-image-dialog';
import {BolStatblockData, BolStatblockEntry, BolStatblockTile} from '../models/bol-statblock.model';

type SheetKind = 'hero' | 'pnj' | 'creature' | 'demon';

const KIND_LABEL: Record<SheetKind, string> = {hero: 'Héros', pnj: 'PNJ', creature: 'Créature', demon: 'Démon'};
const KIND_ICON: Record<SheetKind, string> = {hero: 'gi-sword', pnj: 'gi-group', creature: 'gi-paw', demon: 'gi-demon'};

/** Une famille de tuiles du statbloc : son titre et ses chiffres. */
interface TileGroup {
  readonly label: string;
  readonly tiles: readonly BolStatblockTile[];
}

/** Fiche d'un personnage BoL, faite pour tenir à l'écran : un bandeau d'identité (médaillon, nom, type, vitalité en cœur, héroïsme
 * en gemmes), les chiffres en tuiles rangés par famille (attributs, combat, ce qu'il a en main), puis les listes en colonnes
 * (carrières, traits, armes, armures, capacités…). Sert aux bibliothèques et à la réserve (dialogue du statbloc) et à la carte d'un
 * PNJ, d'une créature ou d'un démon sur la table : celle-ci y projette son stepper de vitalité (`sheetSide`), ses boutons
 * (`sheetActions`) et un pied (`sheetFooter`). */
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
  private readonly dialog = inject(MatDialog);
  private readonly avatarFailed = signal(false);

  constructor() {
    // Posée dans un dialogue (bibliothèques), la fiche le ferme quand un de ses liens (« Modifier la fiche ») navigue.
    if (this.dialogRef) {
      inject(Router)
        .events.pipe(
          filter((event) => event instanceof NavigationStart),
          takeUntilDestroyed(),
        )
        .subscribe(() => this.dialogRef?.close());
    }
  }

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
  /** Les pastilles du statbloc (rang, joueur, région), à la suite du sous-titre : celles qu'il dit déjà ne sont pas répétées (sur la
   * table, le sous-titre d'un PNJ porte déjà son rang). */
  protected readonly metaChips = computed(() => {
    const subtitle = (this.displaySubtitle() ?? '').toLowerCase();
    return this.data().chips.filter((chip) => !subtitle.includes(chip.label.toLowerCase()));
  });
  protected readonly hasAvatar = computed(() => !!this.imageSrc() && !this.avatarFailed());
  protected readonly kindIcon = computed(() => KIND_ICON[this.sheetKind()]);

  /** Vitalité du statbloc, pour le cœur fixe. */
  protected readonly vitality = computed(() => this.data().vitals.find((tile) => tile.tone === 'health') ?? null);

  /** Héroïsme, en gemmes : cinq au moins (la limite habituelle), allumées jusqu'au nombre de points. `null` sans héroïsme. */
  protected readonly heroism = computed(() => {
    const tile = this.data().vitals.find((entry) => entry.tone === 'heroism');
    const points = tile ? Number(tile.value) : 0;
    return tile && points > 0 ? {points, gems: Array.from({length: Math.max(5, points)}, (_, index) => index < points)} : null;
  });

  /** Les chiffres, par famille : les attributs, le combat (les deux moitiés des tuiles), puis ce que le personnage a en main —
   * ses dégâts d'abord, puis sa protection ou sa défense. */
  protected readonly groups = computed<readonly TileGroup[]>(() => {
    const equipment = this.data().vitals.filter((tile) => tile.tone !== 'health' && tile.tone !== 'heroism');
    const armed = [...equipment.filter((tile) => tile.tone === 'damage'), ...equipment.filter((tile) => tile.tone !== 'damage')];
    const groups: TileGroup[] = [
      {label: 'Attributs', tiles: this.half(true)},
      {label: 'Combat', tiles: this.half(false)},
      {label: this.sheetKind() === 'creature' || this.sheetKind() === 'demon' ? 'Au contact' : 'En main', tiles: armed},
    ];
    return groups.filter((group) => group.tiles.length > 0);
  });

  /** Ce que la légende du bas doit expliquer : les pastilles d'équipement, les signes des traits. */
  protected readonly legend = computed(() => {
    const entries = this.data().sections.flatMap((section) => section.entries);
    return {equipment: entries.some((entry) => entry.equipped !== undefined), traits: entries.some((entry) => entry.sign !== undefined)};
  });

  /** L'infobulle d'une ligne d'équipement : son nom en entier (il peut être coupé à l'écran), puis son détail. */
  protected rowTooltip(entry: BolStatblockEntry): string {
    return entry.detail ? `${entry.label} : ${entry.detail}` : entry.label;
  }

  protected navigationState(): Record<string, string> | undefined {
    const returnUrl = this.returnUrl();
    return returnUrl ? {returnUrl} : undefined;
  }

  /** Le portrait, en grand (1:1). */
  protected openPortrait(): void {
    openImageDialog(this.dialog, {src: this.imageSrc(), alt: `Portrait de ${this.displayName()}`});
  }

  protected onAvatarError(): void {
    this.avatarFailed.set(true);
  }

  private half(first: boolean): readonly BolStatblockTile[] {
    const tiles = this.data().tiles;
    const cut = this.data().attributs ?? Math.ceil(tiles.length / 2);
    return first ? tiles.slice(0, cut) : tiles.slice(cut);
  }
}
