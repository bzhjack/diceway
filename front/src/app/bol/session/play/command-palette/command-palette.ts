import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  Signal,
  signal,
} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {map, Observable, take} from 'rxjs';
import {
  buildResults,
  flattenResults,
  nextIndex,
  PaletteCommand,
  PaletteContext,
  PaletteResult,
} from './command-palette.util';

export interface CommandPaletteData {
  /** État de la table, en signal : les résultats suivent l'arrivée de la bibliothèque et des scènes. */
  readonly context: Signal<PaletteContext>;
}

/** Barre de commande de la table : un champ, des résultats groupés, navigation au clavier. Ne parle à
 * aucun service — se ferme avec la commande choisie, que `session-play-page` exécute. */
@Component({
  selector: 'bol-command-palette',
  imports: [MatIconModule],
  templateUrl: './command-palette.html',
  styleUrl: './command-palette.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandPaletteComponent {
  private readonly data = inject<CommandPaletteData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<CommandPaletteComponent, PaletteCommand>);

  protected readonly query = signal('');

  protected readonly groups = computed(() => buildResults({...this.data.context(), query: this.query()}));
  private readonly flat = computed(() => flattenResults(this.groups()));
  protected readonly count = computed(() => this.flat().length);

  /** Index du résultat actif ; revient au premier dès que la liste change (saisie, données arrivées). */
  private readonly activeIndex = linkedSignal<number>(() => (this.flat().length > 0 ? 0 : -1));

  protected readonly activeId = computed(() => this.flat()[this.activeIndex()]?.id ?? null);

  protected readonly emptyMessage = computed(() => `Rien ne correspond à « ${this.query().trim()} ».`);

  /** Annonce pour les lecteurs d'écran (région aria-live). */
  protected readonly status = computed(() => {
    const count = this.count();
    if (count === 0) {
      return 'Aucun résultat';
    }
    return count === 1 ? '1 résultat' : `${count} résultats`;
  });

  constructor() {
    // Garde le résultat actif visible quand on parcourt la liste au clavier.
    afterRenderEffect(() => {
      const id = this.activeId();
      if (id) {
        document.getElementById(id)?.scrollIntoView({block: 'nearest'});
      }
    });
  }

  protected setQuery(value: string): void {
    this.query.set(value);
  }

  protected move(delta: -1 | 1, event: Event): void {
    event.preventDefault();
    this.activeIndex.set(nextIndex(this.activeIndex(), this.count(), delta));
  }

  protected runActive(event: Event): void {
    event.preventDefault();
    const result = this.flat()[this.activeIndex()];
    if (result) {
      this.run(result);
    }
  }

  protected activate(result: PaletteResult): void {
    const index = this.flat().findIndex((r) => r.id === result.id);
    if (index >= 0 && index !== this.activeIndex()) {
      this.activeIndex.set(index);
    }
  }

  protected run(result: PaletteResult): void {
    this.ref.close(result.command);
  }
}

/** Ouvre la barre de commande et émet une seule fois la commande choisie, ou `null` si annulé. */
export function openCommandPalette(dialog: MatDialog, data: CommandPaletteData): Observable<PaletteCommand | null> {
  return dialog
    .open(CommandPaletteComponent, {
      data,
      width: 'min(560px, 92vw)',
      maxWidth: '92vw',
      position: {top: '12vh'},
      panelClass: 'pal-panel',
    })
    .afterClosed()
    .pipe(
      take(1),
      map((command: PaletteCommand | undefined) => command ?? null),
    );
}
