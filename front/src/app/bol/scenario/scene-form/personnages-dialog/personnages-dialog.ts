import {ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {Observable} from 'rxjs';
import {AvatarFallbackDirective} from '../../../../shared/avatar-fallback/avatar-fallback.directive';
import {BolSceneDistributionSaisie} from '../../../models/bol-scene.model';
import {CombatCatalogEntry} from '../../../models/combat-selection.model';
import {CombatSelectionService} from '../../../services/combat-selection.service';
import {RANG_LABELS} from '../../../shared/library/library-rows-page.base';
import {LibraryRang, LibrarySource} from '../../../shared/models/library-rows.model';
import {PersonnagesDialogData, PersonnagesFiltres, PersonnageType} from '../../models/personnages-dialog.model';
import {ScenePersonnageVue} from '../../models/scene-form.model';
import {aUnPortrait, avecLaFiche, avecLeReglage, cleDuPersonnage, compteDesCamps, memesPersonnages, PERSONNAGES_MAX, personnagesVus} from '../scene-form.util';
import {ScenePersoComponent} from '../scene-perso/scene-perso';
import {fichesDeScene, filtrerFiches, lignesDesFiches, optionsDesFiltres, scenariosDe} from './personnages-dialog.util';

/**
 * « Ajouter des personnages » à une scène, comme un casting : en haut, un bandeau à l'illustration de la scène, son titre, son ambiance et
 * la recherche ; puis les filtres (type, scénario, rang, source), chaque option avec son nombre ; à gauche, toutes les fiches de PNJ, de
 * créatures et de démons (catalogue et compte) en portraits, un clic en faisant entrer une (un second clic, un exemplaire de plus) ; à
 * droite, « La distribution » : les personnages de la scène, à régler (nombre, camp, attitude) ou à retirer. Se ferme avec les personnages
 * de la scène tels que la distribution les montre (ou rien, pour ne rien changer).
 */
@Component({
  selector: 'bol-personnages-dialog',
  imports: [AvatarFallbackDirective, MatButtonModule, MatDialogModule, MatIconModule, MatMenuModule, ScenePersoComponent],
  templateUrl: './personnages-dialog.html',
  styleUrl: './personnages-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class PersonnagesDialogComponent {
  protected readonly data = inject<PersonnagesDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<PersonnagesDialogComponent, BolSceneDistributionSaisie[]>);
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
  protected readonly options = computed(() => optionsDesFiltres(this.fiches(), this.filtres()));
  protected readonly filtresActifs = computed(
    () => this.type() !== null || this.source() !== 'tout' || this.rang() !== null || this.scenarioId() !== null || this.recherche() !== '',
  );

  /** Le panier : les personnages de la scène, ceux d'avant puis ceux ajoutés, dans l'ordre où ils entrent. */
  private readonly personnages = signal<BolSceneDistributionSaisie[]>([...this.data.personnages]);
  private readonly initiaux = new Set(this.data.personnages.map((p) => cleDuPersonnage(p.kind, p.source_id)));
  protected readonly panier = computed(() => personnagesVus(this.personnages(), this.catalogue.catalog(), this.fiches().length > 0));
  protected readonly lignes = computed(() => lignesDesFiches(filtrerFiches(this.fiches(), this.filtres()), this.personnages()));
  protected readonly total = computed(() => this.personnages().reduce((somme, p) => somme + p.qty, 0));
  protected readonly camps = computed(() => compteDesCamps(this.personnages()));
  protected readonly nouveaux = computed(() => this.personnages().filter((p) => !this.initiaux.has(cleDuPersonnage(p.kind, p.source_id))).length);
  /** Le titre du scénario choisi, pour sa pastille. */
  protected readonly scenarioChoisi = computed(() => this.options().scenarios.find((s) => s.id === this.scenarioId())?.titre ?? null);
  protected readonly pleine = computed(() => this.personnages().length >= PERSONNAGES_MAX);
  protected readonly change = computed(() => !memesPersonnages(this.personnages(), this.data.personnages));

  protected readonly rangLabels = RANG_LABELS;
  protected readonly aUnPortrait = aUnPortrait;

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

  /** Un rang ou une source se choisit d'un clic, et se rend d'un second. */
  protected basculerLeRang(rang: LibraryRang | null): void {
    this.rang.update((actuel) => (actuel === rang ? null : rang));
  }

  protected basculerLaSource(source: LibrarySource): void {
    this.source.update((actuelle) => (actuelle === source ? 'tout' : source));
  }

  protected effacerLesFiltres(): void {
    this.type.set(null);
    this.source.set('tout');
    this.rang.set(null);
    this.scenarioId.set(null);
    this.recherche.set('');
  }

  protected ajouter(fiche: CombatCatalogEntry): void {
    this.personnages.update((liste) => avecLaFiche(liste, fiche));
  }

  protected regler(index: number, reglage: Partial<Pick<BolSceneDistributionSaisie, 'qty' | 'camp' | 'attitude'>>): void {
    this.personnages.update((liste) => avecLeReglage(liste, index, reglage));
  }

  protected retirer(index: number): void {
    this.personnages.update((liste) => liste.filter((_, position) => position !== index));
  }

  protected nouveau(perso: ScenePersonnageVue): boolean {
    return !this.initiaux.has(cleDuPersonnage(perso.kind, perso.source_id));
  }

  protected valider(): void {
    this.ref.close(this.personnages());
  }
}

/** Ouvre « Ajouter des personnages » ; émet les personnages de la scène une fois validés, ou `undefined` pour ne rien changer. */
export function openPersonnagesDialog(dialog: MatDialog, data: PersonnagesDialogData): Observable<BolSceneDistributionSaisie[] | undefined> {
  return dialog
    .open<PersonnagesDialogComponent, PersonnagesDialogData, BolSceneDistributionSaisie[]>(PersonnagesDialogComponent, {
      data,
      width: 'min(1320px, 96vw)',
      maxWidth: '96vw',
      height: 'min(660px, 94dvh)',
      autoFocus: '#pdg-recherche',
      ariaLabelledBy: 'pdg-titre',
    })
    .afterClosed();
}
