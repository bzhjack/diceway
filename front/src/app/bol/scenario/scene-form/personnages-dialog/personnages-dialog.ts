import {ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {Observable} from 'rxjs';
import {AvatarFallbackDirective} from '../../../../shared/avatar-fallback/avatar-fallback.directive';
import {CombatCatalogEntry} from '../../../models/combat-selection.model';
import {CombatSelectionService} from '../../../services/combat-selection.service';
import {KIND_LABEL} from '../../../session/play/reserve/reserve.util';
import {LibraryFacetteComponent} from '../../../shared/library/library-facette/library-facette';
import {LibraryFacettesComponent} from '../../../shared/library/library-facettes/library-facettes';
import {RANG_LABELS} from '../../../shared/library/library-rows-page.base';
import {LibraryRang, LibrarySource} from '../../../shared/models/library-rows.model';
import {PersonnagesDialogData, PersonnagesFiltres, PersonnageType} from '../../models/personnages-dialog.model';
import {fichesDeScene, filtrerFiches, optionsDesFiltres, rangDe, scenariosDe} from './personnages-dialog.util';

/**
 * « Ajouter des personnages » à une scène : toutes les fiches de PNJ, de créatures et de démons (catalogue et compte) en cartes, avec
 * à gauche les filtres toujours visibles (type, source, rang, scénario), chaque option avec son nombre ; un clic choisit une carte ou
 * la rend. Se ferme avec les fiches choisies (ou rien). Un PNJ déjà en scène ne se choisit pas une deuxième fois.
 */
@Component({
  selector: 'bol-personnages-dialog',
  imports: [AvatarFallbackDirective, LibraryFacetteComponent, LibraryFacettesComponent, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './personnages-dialog.html',
  styleUrl: './personnages-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class PersonnagesDialogComponent {
  private readonly data = inject<PersonnagesDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<PersonnagesDialogComponent, CombatCatalogEntry[]>);
  private readonly catalogue = inject(CombatSelectionService);

  private readonly fiches = computed(() => fichesDeScene(this.catalogue.catalog()));
  /** Un catalogue déjà lu reste montré, même si une relecture échoue. */
  protected readonly etat = computed(() =>
    this.fiches().length > 0 ? 'pret' : this.catalogue.loadFailed() ? 'echec' : this.catalogue.loading() ? 'chargement' : 'pret',
  );

  protected readonly type = signal<PersonnageType>(null);
  protected readonly source = signal<LibrarySource>('tout');
  protected readonly rang = signal<LibraryRang | null>(null);
  /** Le scénario de la scène, s'il cite déjà des fiches ; sinon tous. */
  protected readonly scenarioId = signal<string | null>(null);
  protected readonly recherche = signal('');

  private readonly filtres = computed(
    (): PersonnagesFiltres => ({type: this.type(), source: this.source(), rang: this.rang(), scenarioId: this.scenarioId(), recherche: this.recherche()}),
  );
  protected readonly visibles = computed(() => filtrerFiches(this.fiches(), this.filtres()));
  protected readonly options = computed(() => optionsDesFiltres(this.fiches(), this.filtres()));
  protected readonly filtresActifs = computed(
    () => this.type() !== null || this.source() !== 'tout' || this.rang() !== null || this.scenarioId() !== null || this.recherche() !== '',
  );

  /** Les fiches choisies, par `catalogId`, dans l'ordre du choix. */
  private readonly choisies = signal<ReadonlyMap<string, CombatCatalogEntry>>(new Map());
  protected readonly nombreChoisi = computed(() => this.choisies().size);
  /** La scène n'a plus de place pour une fiche de plus : les cartes non choisies ne se choisissent plus. */
  protected readonly complet = computed(() => this.choisies().size >= this.data.placesLibres);

  protected readonly kindLabel = KIND_LABEL;
  protected readonly rangLabels = RANG_LABELS;
  protected readonly rangDe = rangDe;

  constructor() {
    // La page « Préparer la scène » l'a déjà lu : on ne le relit que s'il manque.
    if (this.catalogue.catalog().length === 0) {
      this.catalogue.loadCatalog();
    }
    // Le scénario de la scène est proposé d'office, une seule fois, dès que les fiches sont lues et s'il en cite.
    let propose = false;
    effect(() => {
      const fiches = this.fiches();
      const scenarioId = this.data.scenarioId;
      if (propose || !scenarioId || fiches.length === 0) {
        return;
      }
      propose = true;
      if (fiches.some((fiche) => scenariosDe(fiche).some((s) => s.id === scenarioId))) {
        untracked(() => this.scenarioId.set(scenarioId));
      }
    });
  }

  protected chercher(event: Event): void {
    this.recherche.set((event.target as HTMLInputElement).value);
  }

  protected effacerLesFiltres(): void {
    this.type.set(null);
    this.source.set('tout');
    this.rang.set(null);
    this.scenarioId.set(null);
    this.recherche.set('');
  }

  protected choisie(fiche: CombatCatalogEntry): boolean {
    return this.choisies().has(fiche.catalogId);
  }

  protected dejaEnScene(fiche: CombatCatalogEntry): boolean {
    return fiche.kind === 'pnj' && this.data.pnjsEnScene.has(`pnj:${fiche.sourceId}`);
  }

  protected basculer(fiche: CombatCatalogEntry): void {
    if (this.dejaEnScene(fiche) || (this.complet() && !this.choisie(fiche))) {
      return;
    }
    this.choisies.update((choisies) => {
      const suivantes = new Map(choisies);
      if (!suivantes.delete(fiche.catalogId)) {
        suivantes.set(fiche.catalogId, fiche);
      }
      return suivantes;
    });
  }

  protected ajouter(): void {
    this.ref.close([...this.choisies().values()]);
  }
}

/** Ouvre « Ajouter des personnages » ; émet les fiches choisies, ou `undefined` sans choix. */
export function openPersonnagesDialog(dialog: MatDialog, data: PersonnagesDialogData): Observable<CombatCatalogEntry[] | undefined> {
  return dialog
    .open<PersonnagesDialogComponent, PersonnagesDialogData, CombatCatalogEntry[]>(PersonnagesDialogComponent, {
      data,
      width: 'min(1200px, 96vw)',
      maxWidth: '96vw',
      height: 'min(660px, 94dvh)',
      autoFocus: '#pdg-recherche',
    })
    .afterClosed();
}
