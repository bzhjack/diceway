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
import {combatantRankKey, combatantRankLabel} from '../../../session/combat-statblock.util';
import {KIND_LABEL} from '../../../session/play/reserve/reserve.util';
import {PersonnageRang, PersonnageSource, PersonnagesDialogData, PersonnagesFiltres, PersonnageType} from '../../models/personnages-dialog.model';
import {fichesDeScene, filtrerFiches, optionsDesFiltres, scenariosDe, scenariosDesFiches} from './personnages-dialog.util';

/** La lettre du rang pour sa pastille (`dw-lr-rang--R`, `--C`, `--P`). */
const LETTRE_DU_RANG = {rival: 'R', coriace: 'C', pietaille: 'P'} as const;

/**
 * « Ajouter des personnages » à une scène : toutes les fiches de PNJ, de créatures et de démons (catalogue et compte) en cartes, avec
 * à gauche les filtres toujours visibles (type, source, rang, scénario), chaque option avec son nombre ; un clic choisit une carte ou
 * la rend. Se ferme avec les fiches choisies (ou rien). Un PNJ déjà en scène ne se choisit pas une deuxième fois.
 */
@Component({
  selector: 'bol-personnages-dialog',
  imports: [AvatarFallbackDirective, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './personnages-dialog.html',
  styleUrl: './personnages-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class PersonnagesDialogComponent {
  private readonly data = inject<PersonnagesDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<PersonnagesDialogComponent, CombatCatalogEntry[]>);
  private readonly catalogue = inject(CombatSelectionService);

  private readonly fiches = computed(() => fichesDeScene(this.catalogue.catalog()));
  protected readonly etat = computed(() =>
    this.catalogue.loadFailed() ? 'echec' : this.catalogue.loading() && this.fiches().length === 0 ? 'chargement' : 'pret',
  );

  protected readonly type = signal<PersonnageType>('tous');
  protected readonly source = signal<PersonnageSource>('tout');
  protected readonly rang = signal<PersonnageRang>('tous');
  /** Le scénario de la scène, s'il cite déjà des fiches ; sinon tous. */
  protected readonly scenarioId = signal<string | null>(null);
  protected readonly recherche = signal('');

  private readonly filtres = computed(
    (): PersonnagesFiltres => ({type: this.type(), source: this.source(), rang: this.rang(), scenarioId: this.scenarioId(), recherche: this.recherche()}),
  );
  protected readonly visibles = computed(() => filtrerFiches(this.fiches(), this.filtres()));
  protected readonly options = computed(() => optionsDesFiltres(this.fiches(), this.filtres()));
  protected readonly scenarios = computed(() => scenariosDesFiches(this.fiches(), this.filtres()));
  protected readonly filtresActifs = computed(
    () => this.type() !== 'tous' || this.source() !== 'tout' || this.rang() !== 'tous' || this.scenarioId() !== null || this.recherche() !== '',
  );

  /** Les fiches choisies, par `catalogId`, dans l'ordre du choix. */
  private readonly choisies = signal<ReadonlyMap<string, CombatCatalogEntry>>(new Map());
  protected readonly nombreChoisi = computed(() => this.choisies().size);

  protected readonly kindLabel = KIND_LABEL;
  protected readonly rangLabel = combatantRankLabel;

  constructor() {
    this.catalogue.loadCatalog();
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

  protected basculerScenario(id: string): void {
    this.scenarioId.update((courant) => (courant === id ? null : id));
  }

  protected effacerLesFiltres(): void {
    this.type.set('tous');
    this.source.set('tout');
    this.rang.set('tous');
    this.scenarioId.set(null);
    this.recherche.set('');
  }



  protected choisie(fiche: CombatCatalogEntry): boolean {
    return this.choisies().has(fiche.catalogId);
  }

  protected dejaEnScene(fiche: CombatCatalogEntry): boolean {
    return fiche.kind === 'pnj' && this.data.pnjsEnScene.has(`pnj:${fiche.sourceId}`);
  }

  protected lettreDuRang(fiche: CombatCatalogEntry): string {
    const rang = combatantRankKey(fiche);
    return rang ? LETTRE_DU_RANG[rang] : 'C';
  }

  protected basculer(fiche: CombatCatalogEntry): void {
    if (this.dejaEnScene(fiche)) {
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
