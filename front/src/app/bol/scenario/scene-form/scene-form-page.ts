import {ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal} from '@angular/core';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {applyEach, form, FormField, maxLength, required} from '@angular/forms/signals';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatMenuModule} from '@angular/material/menu';
import {MatSelectModule} from '@angular/material/select';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ActivatedRoute, Router} from '@angular/router';
import {forkJoin, map, Observable, switchMap, tap} from 'rxjs';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {HasPendingChanges} from '../../../core/models/pending-changes-guard.model';
import {readReturnUrl} from '../../../core/return-url.util';
import {confirmLeaveUnsaved} from '../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {BolSceneDistributionSaisie, SceneJetAttribut, SceneMeteo, BolSceneModel, SceneMoment} from '../../models/bol-scene.model';
import {BolCatalogService} from '../../services/bol-catalog.service';
import {BolScenarioService} from '../../services/bol-scenario.service';
import {BolSceneService} from '../../services/bol-scene.service';
import {CombatSelectionService} from '../../services/combat-selection.service';
import {SCENE_TITLE_MAX} from '../../session/play/scene-list/scene.util';
import {
  JET_ATTRIBUTS,
  JET_ATTRIBUTS_MAX,
  JET_DIFFICULTE_PAR_DEFAUT,
  JET_DIFFICULTES,
  JET_TEXTE_MAX,
  JET_TITRE_MAX,
  JETS_MAX,
  libelleDifficulte,
} from '../../shared/scene-jets.util';
import {METEOS, MOMENTS, sceneDecor} from '../../session/play/theatre/theatre.util';
import {titreDeChapitre} from '../../session/scenario.util';
import {openPersonnagesDialog} from './personnages-dialog/personnages-dialog';
import {openRegionCarte} from '../../shared/region/region-carte-dialog';
import {JetSaisie, SceneOnglet, SceneTexte} from '../models/scene-form.model';
import {SceneCarteComponent} from './scene-carte/scene-carte';
import {
  ambianceEnPhrase,
  avecLeReglage,
  compteDesCamps,
  dureeDeLecture,
  memesPersonnages,
  personnagesDe,
  personnagesVus,
  sceneChanges,
  sceneFormValue,
} from './scene-form.util';

const PISTES_MAX = 8;
const LECTURE_MAX = 5000;
const JEU_MAX = 10000;
const NOTES_MAX = 10000;
/** Où revenir sans adresse de retour : la bibliothèque des scénarios. */
const RETOUR_PAR_DEFAUT = '/library/scenarios';

/** Les trois textes d'une scène, un onglet chacun ; leur aide se lit dans le champ vide. */
const TEXTES: readonly {cle: SceneTexte; label: string; max: number; aide: string}[] = [
  {cle: 'lecture', label: 'À lire aux joueurs', max: LECTURE_MAX, aide: 'Lu à voix haute quand la scène commence…'},
  {cle: 'jeu', label: 'Mise en scène', max: JEU_MAX, aide: "Comment jouer la scène : les consignes et les lieux, les tables d'effets ; les jets ont leur onglet…"},
  {cle: 'notes', label: 'Secret du MJ', max: NOTES_MAX, aide: 'Ce que les joueurs ne savent pas…'},
];

/** Les onglets de la carte, dans l'ordre du carnet de la table : le texte à lire, les jets, la mise en scène, le secret, les pistes. */
const ONGLETS: readonly {cle: SceneOnglet; label: string}[] = [
  {cle: 'lecture', label: 'À lire aux joueurs'},
  {cle: 'jets', label: 'Jets'},
  {cle: 'jeu', label: 'Mise en scène'},
  {cle: 'notes', label: 'Secret du MJ'},
  {cle: 'pistes', label: 'Pistes'},
];

/** Un jet tout neuf : un titre à écrire, sans attribut, de difficulté Moyenne. */
function jetVide(): JetSaisie {
  return {titre: '', attributs: [], difficulte: JET_DIFFICULTE_PAR_DEFAUT, enjeu: '', echec: '', reussite: '', carriere: '', quand: ''};
}

/**
 * « Préparer la scène », sur sa propre page (`/create/scene/:id`, ou `/create/scene?chapitre=…` pour une nouvelle), comme une affiche :
 * en haut, l'illustration de la scène en bandeau (celle de la table, sinon son décor par défaut ; elle ne s'édite pas ici), avec par-dessus
 * son lieu et sa région, son titre, et son ambiance en pastilles (moment, météo, danger), chacun se changeant sur place ; dessous, son
 * texte (à lire aux joueurs, mise en scène, secret du MJ), ses jets et ses pistes, un onglet chacun, et « La distribution » : ses
 * personnages (PNJ,
 * créatures, démons du catalogue et du compte) en cartes portraits, leur nombre, leur camp et leur attitude au chargement se réglant d'un
 * clic sur la carte. Enregistre, puis revient d'où l'on venait (`returnUrl` : la table, la bibliothèque des scénarios).
 */
@Component({
  selector: 'bol-scene-form-page',
  imports: [
    FormField,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatSelectModule,
    SceneCarteComponent,
  ],
  templateUrl: './scene-form-page.html',
  styleUrl: './scene-form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneFormPageComponent implements HasPendingChanges {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly sceneService = inject(BolSceneService);
  private readonly scenarioService = inject(BolScenarioService);
  private readonly selection = inject(CombatSelectionService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly moments = MOMENTS;
  protected readonly meteos = METEOS;
  protected readonly dangers = [1, 2, 3, 4];
  protected readonly onglets = ONGLETS;
  protected readonly pistesMax = PISTES_MAX;
  protected readonly jetsMax = JETS_MAX;
  protected readonly jetAttributs = JET_ATTRIBUTS;
  protected readonly jetAttributsMax = JET_ATTRIBUTS_MAX;
  protected readonly jetDifficultes = JET_DIFFICULTES.map((d) => ({cle: d.cle, label: libelleDifficulte(d.cle)}));

  private readonly returnUrl = readReturnUrl() ?? RETOUR_PAR_DEFAUT;
  /** La scène à préparer ; pour une nouvelle, celle créée au premier enregistrement (un second essai, après un échec, la reprend). */
  private readonly sceneId = signal(this.route.snapshot.paramMap.get('id'));
  /** Pour une nouvelle scène : le chapitre où elle naît, à la suite des autres. */
  private readonly chapitreId = this.route.snapshot.queryParamMap.get('chapitre');
  protected readonly nouvelle = this.sceneId() === null;

  protected readonly regions = toSignal(
    inject(BolCatalogService)
      .regions()
      .pipe(map((regions) => [...regions].sort((left, right) => left.region.localeCompare(right.region, 'fr')))),
    {initialValue: []},
  );

  /** La scène lue (null pour une nouvelle, ou tant qu'elle n'est pas lue) et les autres scènes de son chapitre, où mènent les pistes. */
  private readonly scene = signal<BolSceneModel | null>(null);
  protected readonly siblings = signal<readonly BolSceneModel[]>([]);
  private readonly chapitreTitre = signal<string | null>(null);
  /** Le scénario (`BolSaga`) du chapitre de la scène : « Ajouter des personnages » propose d'abord ses fiches. */
  private readonly sagaId = signal<string | null>(null);
  protected readonly loading = signal(!this.nouvelle);

  private readonly value = signal(sceneFormValue(null));
  private readonly initial = signal(sceneFormValue(null));
  protected readonly sceneForm = form(this.value, (path) => {
    required(path.titre);
    maxLength(path.titre, SCENE_TITLE_MAX);
    maxLength(path.lieu, 120);
    maxLength(path.lecture, LECTURE_MAX);
    maxLength(path.jeu, JEU_MAX);
    maxLength(path.notes, NOTES_MAX);
    applyEach(path.pistes, (piste) => maxLength(piste.texte, 200));
    applyEach(path.jets, (jet) => {
      required(jet.titre);
      maxLength(jet.titre, JET_TITRE_MAX);
      for (const texte of [jet.enjeu, jet.echec, jet.reussite, jet.carriere, jet.quand]) {
        maxLength(texte, JET_TEXTE_MAX);
      }
    });
  });

  /** Les personnages de la scène, dans l'ordre où ils entrent ; à part du formulaire, réglés ligne par ligne. */
  private readonly personnages = signal<BolSceneDistributionSaisie[]>([]);
  private readonly personnagesInitiaux = signal<BolSceneDistributionSaisie[]>([]);
  protected readonly personnagesAffiches = computed(() =>
    personnagesVus(this.personnages(), this.selection.catalog(), !this.selection.loading() && !this.selection.loadFailed()),
  );
  protected readonly nombreDePersonnages = computed(() => this.personnages().length);
  protected readonly camps = computed(() => compteDesCamps(this.personnages()));

  /** Le bandeau : l'illustration de la scène, sinon le décor par défaut de la table ; une image qui ne se charge pas y retombe aussi. */
  private readonly imageEnEchec = signal(false);
  protected readonly decor = computed(() => sceneDecor(this.imageEnEchec() ? null : this.scene()));
  /** Où la scène se place dans son chapitre : « scène 7 sur 9 », ou « nouvelle scène ». */
  protected readonly position = computed(() => {
    const scene = this.scene();
    if (!scene) {
      return 'nouvelle scène';
    }
    const rang = this.siblings().filter((s) => s.ordre < scene.ordre).length + 1;
    return `scène ${rang} sur ${this.siblings().length + 1}`;
  });

  /** L'ambiance en pastilles : le moment, la météo, le danger et la région choisis. */
  protected readonly moment = computed(() => MOMENTS.find((m) => m.value === this.value().moment) ?? null);
  protected readonly meteo = computed(() => METEOS.find((m) => m.value === this.value().meteo) ?? null);
  protected readonly danger = computed(() => this.value().danger);
  protected readonly region = computed(() => this.regions().find((r) => r.id === this.value().region_id)?.region ?? null);

  protected readonly valid = computed(() => this.sceneForm().valid());
  /** L'onglet ouvert (un texte, les jets ou les pistes), et le texte qu'il montre : son libellé, sa longueur et son maximum, son aide. */
  protected readonly onglet = signal<SceneOnglet>('lecture');
  protected readonly surUnTexte = computed(() => TEXTES.some((t) => t.cle === this.onglet()));
  protected readonly texte = computed(() => {
    const texte = TEXTES.find((t) => t.cle === this.onglet()) ?? TEXTES[0];
    return {...texte, longueur: this.value()[texte.cle].length};
  });
  /** Le temps de lire à voix haute le texte « À lire aux joueurs ». */
  protected readonly dureeLecture = computed(() => dureeDeLecture(this.value().lecture));
  protected readonly pisteCount = computed(() => this.value().pistes.length);
  protected readonly jetCount = computed(() => this.value().jets.length);
  /** Les pistes écrites, sous le texte : chacune avec la scène où elle mène. */
  protected readonly pistesEcrites = computed(() =>
    this.value()
      .pistes.filter((piste) => piste.texte.trim() !== '')
      .map((piste) => ({texte: piste.texte.trim(), vers: this.siblings().find((s) => s.id === piste.scene_id)?.titre ?? null})),
  );
  protected readonly busy = signal(false);
  private readonly enregistree = signal(false);
  protected readonly dirty = computed(
    () =>
      JSON.stringify(this.value()) !== JSON.stringify(this.initial()) || !memesPersonnages(this.personnages(), this.personnagesInitiaux()),
  );

  protected readonly titre = computed(() => (this.nouvelle ? 'Nouvelle scène' : this.scene()?.titre || 'Préparer la scène'));
  protected readonly surtitre = computed(() => this.chapitreTitre());
  protected readonly retourLabel = this.returnUrl.startsWith('/session/') ? 'Retour à la table' : 'Retour aux scénarios';

  constructor() {
    this.selection.loadCatalog();
    this.charger();
  }

  canLeave(): boolean | Observable<boolean> {
    if (this.enregistree() || !this.dirty()) {
      return true;
    }
    return confirmLeaveUnsaved(this.dialog, 'Cette scène a des changements non sauvegardés. Quitter sans enregistrer ?');
  }

  protected retour(): void {
    void this.router.navigateByUrl(this.returnUrl);
  }

  /** Un texte de la scène a été écrit : son onglet le dit. */
  protected rempli(cle: SceneOnglet): boolean {
    return cle !== 'jets' && cle !== 'pistes' && this.value()[cle].trim() !== '';
  }

  /** Le nombre de jets ou de pistes, dans leur onglet ; 0 pour un texte. */
  protected compte(cle: SceneOnglet): number {
    return cle === 'jets' ? this.jetCount() : cle === 'pistes' ? this.pisteCount() : 0;
  }

  protected imageNonChargee(): void {
    this.imageEnEchec.set(true);
  }

  /** La région se choisit sur la carte de Lémurie ; fermer la carte sans choisir (ou avec autre chose qu'un id ou `null`) la
   * laisse comme elle était. */
  protected choisirSurLaCarte(): void {
    openRegionCarte(this.dialog, {regions: this.regions(), regionId: this.value().region_id}).subscribe((regionId) => {
      if (typeof regionId === 'number' || regionId === null) {
        this.value.update((value) => ({...value, region_id: regionId}));
      }
    });
  }

  protected choisirLeMoment(moment: SceneMoment | null): void {
    this.value.update((value) => ({...value, moment}));
  }

  protected choisirLaMeteo(meteo: SceneMeteo | null): void {
    this.value.update((value) => ({...value, meteo}));
  }

  protected choisirLeDanger(danger: number): void {
    this.value.update((value) => ({...value, danger}));
  }

  protected regler(index: number, reglage: Partial<Pick<BolSceneDistributionSaisie, 'qty' | 'camp' | 'attitude'>>): void {
    this.personnages.update((liste) => avecLeReglage(liste, index, reglage));
  }

  protected retirer(index: number): void {
    this.personnages.update((liste) => liste.filter((_, position) => position !== index));
  }

  /** « Ajouter des personnages » : le dialogue des fiches, filtrées d'abord sur le scénario de la scène, avec la scène en panier ; ce
   * qu'il valide remplace les personnages de la scène. */
  protected choisirDesPersonnages(): void {
    const data = {
      scenarioId: this.sagaId(),
      sceneTitre: this.value().titre.trim() || this.titre(),
      sceneImage: this.decor(),
      sceneAmbiance: ambianceEnPhrase(this.value()),
      personnages: this.personnages(),
    };
    openPersonnagesDialog(this.dialog, data).subscribe((personnages) => {
      if (personnages) {
        this.personnages.set(personnages);
      }
    });
  }

  protected addPiste(): void {
    if (this.pisteCount() < PISTES_MAX) {
      this.value.update((value) => ({...value, pistes: [...value.pistes, {texte: '', scene_id: null}]}));
    }
  }

  protected removePiste(index: number): void {
    this.value.update((value) => ({...value, pistes: value.pistes.filter((_, position) => position !== index)}));
  }

  /** Les jets dont « Réussite, carrière, quand » a été déplié : il le reste, même quand on vide ses champs en tapant. */
  private readonly plusOuverts = signal<ReadonlySet<object>>(new Set());

  /** « Réussite, carrière, quand » est déplié d'office quand l'un d'eux est écrit, ou quand le MJ l'a ouvert. */
  protected plusDeplie(jet: object, valeur: JetSaisie): boolean {
    return this.plusOuverts().has(jet) || Boolean(valeur.reussite || valeur.carriere || valeur.quand);
  }

  protected basculerPlus(jet: object, ouvert: boolean): void {
    this.plusOuverts.update((ouverts) => {
      const suite = new Set(ouverts);
      if (ouvert) {
        suite.add(jet);
      } else {
        suite.delete(jet);
      }
      return suite;
    });
  }

  protected addJet(): void {
    if (this.jetCount() < JETS_MAX) {
      this.value.update((value) => ({...value, jets: [...value.jets, jetVide()]}));
    }
  }

  protected removeJet(index: number): void {
    this.value.update((value) => ({...value, jets: value.jets.filter((_, position) => position !== index)}));
  }

  /** Monte (-1) ou descend (+1) un jet dans la liste. */
  protected deplacerJet(index: number, delta: -1 | 1): void {
    const cible = index + delta;
    this.value.update((value) => {
      if (cible < 0 || cible >= value.jets.length) {
        return value;
      }
      const jets = [...value.jets];
      [jets[index], jets[cible]] = [jets[cible], jets[index]];
      return {...value, jets};
    });
  }

  /** Ajoute ou retire un attribut d'un jet ; deux au plus. */
  protected basculerAttribut(index: number, attribut: SceneJetAttribut): void {
    this.value.update((value) => ({
      ...value,
      jets: value.jets.map((jet, position) => {
        if (position !== index) {
          return jet;
        }
        if (jet.attributs.includes(attribut)) {
          return {...jet, attributs: jet.attributs.filter((a) => a !== attribut)};
        }
        return jet.attributs.length < JET_ATTRIBUTS_MAX ? {...jet, attributs: [...jet.attributs, attribut]} : jet;
      }),
    }));
  }

  /** L'attribut est déjà demandé par ce jet. */
  protected demande(jet: JetSaisie, attribut: SceneJetAttribut): boolean {
    return jet.attributs.includes(attribut);
  }

  /** `(submit)` natif : enregistre la scène (créée d'abord dans son chapitre si elle est nouvelle) et ses personnages, puis revient. */
  protected submit(event: Event): void {
    event.preventDefault();
    if (!this.valid() || this.busy() || this.loading()) {
      return;
    }
    this.busy.set(true);
    const changes = {...sceneChanges(this.value()), distribution: this.personnages()};
    const sceneId = this.sceneId();
    const enregistrement = sceneId
      ? this.sceneService.update(sceneId, changes)
      : this.sceneService.create(this.value().titre.trim(), this.chapitreId).pipe(
          tap((scene) => this.sceneId.set(scene.id)),
          switchMap((scene) => this.sceneService.update(scene.id, changes)),
        );
    enregistrement.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.enregistree.set(true);
        this.retour();
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.snackBar.open(extractApiErrorMessage(error, "Impossible d'enregistrer la scène."), 'Fermer', {duration: 5000});
      },
    });
  }

  /** Lit la scène (ou rien pour une nouvelle), les autres scènes de son chapitre et le nom du chapitre. */
  private charger(): void {
    const sceneId = this.sceneId();
    forkJoin({scenes: this.sceneService.scenes(), chapitres: this.scenarioService.scenarios()})
      .pipe(
        map(({scenes, chapitres}) => {
          const scene = sceneId ? (scenes.find((s) => s.id === sceneId) ?? null) : null;
          const chapitreId = scene?.scenario_id ?? this.chapitreId;
          const siblings = scenes.filter((s) => s.scenario_id === chapitreId && s.id !== sceneId).sort((a, b) => a.ordre - b.ordre);
          return {scene, siblings, chapitre: chapitres.find((c) => c.id === chapitreId) ?? null};
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({scene, siblings, chapitre}) => {
          if (sceneId && !scene) {
            this.snackBar.open('Cette scène est introuvable.', 'Fermer', {duration: 5000});
            this.enregistree.set(true);
            this.retour();
            return;
          }
          this.scene.set(scene);
          this.siblings.set(siblings);
          this.chapitreTitre.set(chapitre ? titreDeChapitre(chapitre) : null);
          this.sagaId.set(chapitre?.saga?.id ?? null);
          const value = sceneFormValue(scene);
          this.value.set(value);
          this.initial.set(sceneFormValue(scene));
          this.personnages.set(personnagesDe(scene));
          this.personnagesInitiaux.set(personnagesDe(scene));
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.snackBar.open(extractApiErrorMessage(error, 'Impossible de lire la scène.'), 'Fermer', {duration: 5000});
        },
      });
  }
}
