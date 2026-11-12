import {CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList, CdkDropListGroup} from '@angular/cdk/drag-drop';
import {afterNextRender, afterRenderEffect, ChangeDetectionStrategy, Component, computed, ElementRef, inject, linkedSignal, signal, viewChild} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Observable, switchMap} from 'rxjs';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {readReturnUrl} from '../../../core/return-url.util';
import {confirmDialog} from '../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {DwLibraryHeaderComponent} from '../../../shared/dw-library-header/dw-library-header';
import {promptDialog} from '../../../shared/dw-prompt-dialog/dw-prompt-dialog';
import {DwTagComponent} from '../../../shared/dw-tag/dw-tag';
import {refreshableResource} from '../../../shared/refreshable-resource';
import {BolScenarioModel} from '../../models/bol-scenario.model';
import {BolSceneModel, SceneMeteo, SceneMoment} from '../../models/bol-scene.model';
import {AmbianceOption} from '../../session/models/theatre.model';
import {BolScenarioService} from '../../services/bol-scenario.service';
import {BolSceneService} from '../../services/bol-scene.service';
import {METEOS, MOMENTS} from '../../session/play/theatre/theatre.util';
import {libelleDeChapitre} from '../../session/scenario.util';
import {ChapitreDialogData, ChapitreDialogResultat} from '../models/chapitre-dialog.model';
import {creerUneScene, preparerLaScene} from '../scene-form/scene-form.util';
import {openChapitreDialog} from './chapitre-dialog/chapitre-dialog';

/** Une scène sur la carte de son chapitre : son ambiance (moment, météo, en mots pour les lecteurs d'écran), son danger, son nombre de
 * figurants et de pistes, prêts à afficher. */
interface SceneVue {
  readonly scene: BolSceneModel;
  readonly moment: AmbianceOption<SceneMoment> | null;
  readonly meteo: AmbianceOption<SceneMeteo> | null;
  readonly ambiance: string;
  readonly figurants: number;
  readonly pistes: number;
}

interface ChapitreVue {
  readonly id: string;
  readonly chapitre: BolScenarioModel;
  readonly libelle: string;
  /** Ce que porte sa médaille : « I » pour l'introduction, son numéro, ou un point sans numéro. */
  readonly marque: string;
  readonly scenes: readonly SceneVue[];
}

/** Un scénario (`BolSaga`) : ses chapitres dans l'ordre, et son nombre de scènes. */
interface ScenarioVue {
  readonly id: string;
  readonly titre: string;
  readonly chapitres: readonly ChapitreVue[];
  readonly nombreDeScenes: number;
}

/** L'introduction d'abord, puis les chapitres par numéro, puis ceux sans numéro par nom. */
function comparerChapitres(a: BolScenarioModel, b: BolScenarioModel): number {
  const rang = (n: number | null | undefined) => n ?? Number.MAX_SAFE_INTEGER;
  return rang(a.numero) - rang(b.numero) || a.titre.localeCompare(b.titre, 'fr');
}

/** Le titre d'un seul tenant que le serveur découpe : « Perle du Beshaar — 1. Sacrilège à Satarla ». */
function titreComplet(scenario: string, numero: number | null, titre: string): string {
  return `${scenario} — ${libelleDeChapitre(numero, titre)}`;
}

/** La médaille d'un chapitre : « I » pour l'introduction, son numéro, sinon la première lettre de son nom. */
function marqueDeChapitre(chapitre: BolScenarioModel): string {
  if (chapitre.numero === 0) {
    return 'I';
  }
  return chapitre.numero !== null && chapitre.numero !== undefined ? String(chapitre.numero) : chapitre.titre.charAt(0).toLocaleUpperCase('fr');
}

function sceneVue(scene: BolSceneModel): SceneVue {
  const moment = MOMENTS.find((m) => m.value === scene.moment) ?? null;
  const meteo = METEOS.find((m) => m.value === scene.meteo) ?? null;
  return {
    scene,
    moment,
    meteo,
    ambiance: [moment?.label, meteo?.label].filter(Boolean).join(' · '),
    figurants: scene.distribution.reduce((total, entree) => total + (entree.qty ?? 1), 0),
    pistes: (scene.pistes ?? []).length,
  };
}

/**
 * La bibliothèque des scénarios : à gauche les scénarios du compte ; à droite celui choisi, en tableau, une colonne par chapitre (son pitch,
 * puis ses scènes en cartes). Une carte se glisse pour ranger la scène dans son chapitre ou la passer à un autre (au clavier, son menu « ⋯ »
 * fait de même) ; un clic l'ouvre dans « Préparer la scène ». Tout s'y crée, s'y renomme, s'y supprime : un scénario naît de son seul nom,
 * un chapitre de « Chapitre », une scène de « + Scène ».
 */
@Component({
  selector: 'bol-scenario-library-page',
  imports: [
    CdkDrag,
    CdkDragPlaceholder,
    CdkDropList,
    CdkDropListGroup,
    DwLibraryHeaderComponent,
    DwTagComponent,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    RouterLink,
  ],
  templateUrl: './scenario-library-page.html',
  styleUrl: './scenario-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {'(window:resize)': 'mesurer()'},
})
export class ScenarioLibraryPageComponent {
  private readonly scenarioService = inject(BolScenarioService);
  private readonly sceneService = inject(BolSceneService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly sagasDuCompte = refreshableResource(() => this.scenarioService.sagas());
  private readonly chapitres = refreshableResource(() => this.scenarioService.scenarios());
  private readonly scenes = refreshableResource(() => this.sceneService.scenes());

  protected readonly returnUrl = signal(readReturnUrl());
  /** Les quatre niveaux de danger d'une scène. */
  protected readonly niveaux = [1, 2, 3, 4];

  private readonly choisi = signal<string | null>(null);
  /** De retour de « Préparer la scène » : le chapitre de la scène, montré et mis en évidence. */
  protected readonly chapitreRevu = signal<string | null>(null);
  /** Et la scène elle-même : sa carte, amenée dans sa colonne, marquée et prise au focus. */
  protected readonly sceneRevue = signal<string | null>(null);
  private readonly router = inject(Router);

  /** Le tableau qui défile en largeur, et de quel côté il reste des chapitres à voir : un chevron s'y montre. */
  private readonly colonnes = viewChild<ElementRef<HTMLElement>>('colonnes');
  protected readonly peutGauche = signal(false);
  protected readonly peutDroite = signal(false);

  /** Les scènes rangées à la main, par chapitre, en attendant que le serveur les relise : une carte déposée reste où on l'a mise. */
  private readonly rangement = linkedSignal<readonly BolSceneModel[], ReadonlyMap<string, readonly string[]>>({
    source: this.scenes.data,
    computation: () => new Map(),
  });

  constructor() {
    // De retour de « Préparer la scène » : le scénario qu'on regardait, et le chapitre de la scène.
    const retour = inject(ActivatedRoute).snapshot.queryParamMap;
    const scenario = retour.get('scenario');
    if (scenario) {
      this.choisi.set(scenario);
    }
    this.chapitreRevu.set(retour.get('chapitre'));
    this.sceneRevue.set(retour.get('scene'));
    // Le chapitre revu est amené dans le tableau, une fois ses colonnes affichées ; la carte de la scène revue, dans sa colonne, prend le
    // focus : le clavier reprend là où on l'avait laissé.
    let amene = false;
    afterRenderEffect(() => {
      const id = this.chapitreRevu();
      if (amene || !id || !this.selection()) {
        return;
      }
      const colonne = document.getElementById(`sl-col-${id}`);
      if (!colonne) {
        return;
      }
      amene = true;
      const carte = this.sceneRevue() ? document.getElementById(`sl-carte-${this.sceneRevue()}`) : null;
      (carte ?? colonne).scrollIntoView?.({block: 'nearest', inline: 'nearest'});
      carte?.querySelector<HTMLButtonElement>('.sl-carte-ouvrir')?.focus({preventScroll: true});
    });
    // Les chevrons suivent le tableau : à chaque rendu (un autre scénario, un chapitre de plus), au défilement et quand la fenêtre change.
    afterRenderEffect(() => {
      this.selection();
      this.mesurer();
    });
    // Le « + » de la tuile Scénarios de l'accueil arrive ici pour en créer un, une seule fois : recharger la page ne le redemande pas.
    const etat = typeof history === 'undefined' ? null : (history.state as Record<string, unknown> | null);
    if (etat?.['nouveau'] === true) {
      history.replaceState({...etat, nouveau: false}, '');
      afterNextRender(() => this.nouveauScenario());
    }
  }

  /** Les scénarios par nom, ceux sans chapitre compris ; chacun avec ses chapitres dans l'ordre et leurs scènes par rang (ou dans l'ordre où
   * on vient de les ranger). */
  protected readonly scenarios = computed((): ScenarioVue[] => {
    const rangement = this.rangement();
    const rangees = new Set([...rangement.values()].flat());
    const parId = new Map(this.scenes.data().map((scene) => [scene.id, scene]));
    const scenesParChapitre = new Map<string, BolSceneModel[]>();
    for (const scene of this.scenes.data()) {
      if (scene.scenario_id && !rangees.has(scene.id)) {
        scenesParChapitre.set(scene.scenario_id, [...(scenesParChapitre.get(scene.scenario_id) ?? []), scene]);
      }
    }
    const scenesDe = (id: string): BolSceneModel[] => {
      const rangeesIci = rangement.get(id);
      if (rangeesIci) {
        return rangeesIci.map((sceneId) => parId.get(sceneId)).filter((scene): scene is BolSceneModel => scene !== undefined);
      }
      return [...(scenesParChapitre.get(id) ?? [])].sort((a, b) => a.ordre - b.ordre);
    };
    const vue = (chapitre: BolScenarioModel): ChapitreVue => ({
      id: chapitre.id ?? '',
      chapitre,
      libelle: libelleDeChapitre(chapitre.numero, chapitre.titre),
      marque: marqueDeChapitre(chapitre),
      scenes: scenesDe(chapitre.id ?? '').map(sceneVue),
    });

    const sagas = new Map<string, {titre: string; chapitres: BolScenarioModel[]}>();
    for (const saga of this.sagasDuCompte.data()) {
      sagas.set(saga.id, {titre: saga.titre, chapitres: []});
    }
    for (const chapitre of this.chapitres.data()) {
      if (chapitre.saga) {
        const saga = sagas.get(chapitre.saga.id) ?? {titre: chapitre.saga.titre, chapitres: []};
        saga.chapitres.push(chapitre);
        sagas.set(chapitre.saga.id, saga);
      }
    }
    return [...sagas]
      .map(([id, saga]): ScenarioVue => {
        const chapitres = [...saga.chapitres].sort(comparerChapitres).map(vue);
        return {id, titre: saga.titre, chapitres, nombreDeScenes: chapitres.reduce((n, c) => n + c.scenes.length, 0)};
      })
      .sort((a, b) => a.titre.localeCompare(b.titre, 'fr'));
  });

  /** Le scénario montré : celui choisi, sinon le premier. */
  protected readonly selection = computed(() => this.scenarios().find((s) => s.id === this.choisi()) ?? this.scenarios()[0] ?? null);

  protected choisir(id: string): void {
    this.choisi.set(id);
    this.chapitreRevu.set(null);
    this.sceneRevue.set(null);
  }

  /** De quel côté le tableau a encore des chapitres hors de vue. */
  protected mesurer(): void {
    const tableau = this.colonnes()?.nativeElement;
    this.peutGauche.set(!!tableau && tableau.scrollLeft > 1);
    this.peutDroite.set(!!tableau && tableau.scrollLeft + tableau.clientWidth < tableau.scrollWidth - 1);
  }

  /** Un chevron fait défiler le tableau d'une colonne, vers la gauche (-1) ou la droite (+1). */
  protected defiler(sens: -1 | 1): void {
    const tableau = this.colonnes()?.nativeElement;
    const colonne = tableau?.querySelector<HTMLElement>('.sl-col');
    if (!tableau || !colonne) {
      return;
    }
    const ecart = parseFloat(getComputedStyle(tableau).columnGap) || 0;
    tableau.scrollBy?.({left: sens * (colonne.offsetWidth + ecart), behavior: 'smooth'});
  }

  /** Les chapitres dont le pitch se lit en entier, par id : tous résumés à deux lignes à l'arrivée. */
  protected readonly ouverts = signal<ReadonlySet<string>>(new Set());

  protected basculer(id: string): void {
    this.ouverts.update((ouverts) => {
      const suivants = new Set(ouverts);
      if (!suivants.delete(id)) {
        suivants.add(id);
      }
      return suivants;
    });
  }

  // ── Les scénarios ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

  /** Un nouveau scénario naît de son seul nom ; ses chapitres s'ajoutent ensuite (« + Chapitre »). */
  protected nouveauScenario(): void {
    promptDialog(this.dialog, {title: 'Nouveau scénario', label: 'Nom du scénario', maxLength: 150, confirmLabel: 'Créer'}).subscribe((titre) => {
      if (titre) {
        this.enregistrer(this.scenarioService.creerScenario(titre.replace(/—/g, '-')), 'Impossible de créer le scénario.', (saga) =>
          this.choisi.set(saga.id),
        );
      }
    });
  }

  protected renommer(scenario: ScenarioVue): void {
    promptDialog(this.dialog, {title: 'Renommer le scénario', label: 'Nom du scénario', value: scenario.titre, maxLength: 150, confirmLabel: 'Renommer'}).subscribe(
      (titre) => {
        if (titre) {
          this.enregistrer(this.scenarioService.renommerScenario(scenario.id, titre.replace(/—/g, '-')), 'Impossible de renommer le scénario.');
        }
      },
    );
  }

  protected supprimerScenario(scenario: ScenarioVue): void {
    const scenes = scenario.nombreDeScenes;
    const chapitres = scenario.chapitres.length;
    const contenu = chapitres
      ? `, ${chapitres > 1 ? `ses ${chapitres} chapitres` : 'son chapitre'} et ${scenes > 1 ? `leurs ${scenes} scènes` : scenes === 1 ? 'sa scène' : 'leurs scènes'}`
      : '';
    confirmDialog(
      this.dialog,
      {title: 'Supprimer le scénario', message: `Supprimer « ${scenario.titre} »${contenu} ? Cette action est irréversible.`, confirmLabel: 'Supprimer'},
      {width: '440px'},
    ).subscribe((confirme) => {
      if (confirme) {
        this.enregistrer(this.scenarioService.supprimerScenario(scenario.id), 'Impossible de supprimer le scénario.', () => this.choisi.set(null));
      }
    });
  }

  // ── Les chapitres ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

  /** Un nouveau chapitre du scénario, au numéro qui suit le dernier. */
  protected nouveauChapitre(scenario: ScenarioVue): void {
    const numeros = scenario.chapitres.map((c) => c.chapitre.numero ?? 0);
    this.dialogueChapitre({
      titre: 'Nouveau chapitre',
      confirmLabel: 'Créer',
      scenario: scenario.titre,
      numero: Math.max(0, ...numeros) + 1,
      chapitre: '',
      pitch: '',
    }).subscribe((resultat) => {
      if (resultat) {
        const titre = titreComplet(scenario.titre, resultat.numero, resultat.titre);
        this.enregistrer(this.scenarioService.create({titre, pitch: resultat.pitch || null}), 'Impossible de créer le chapitre.');
      }
    });
  }

  protected modifierChapitre(scenario: ScenarioVue, vue: ChapitreVue): void {
    const chapitre = vue.chapitre;
    this.dialogueChapitre({
      titre: 'Modifier le chapitre',
      confirmLabel: 'Enregistrer',
      scenario: scenario.titre,
      numero: chapitre.numero ?? null,
      chapitre: chapitre.titre,
      pitch: chapitre.pitch ?? '',
    }).subscribe((resultat) => {
      if (resultat) {
        const titre = titreComplet(scenario.titre, resultat.numero, resultat.titre);
        this.enregistrer(this.scenarioService.update({id: chapitre.id, titre, pitch: resultat.pitch || null}), 'Impossible d’enregistrer le chapitre.');
      }
    });
  }

  protected supprimerChapitre(vue: ChapitreVue): void {
    const scenes = vue.scenes.length;
    confirmDialog(
      this.dialog,
      {
        title: 'Supprimer le chapitre',
        message: `Supprimer « ${vue.libelle} »${scenes ? ` et ${scenes > 1 ? `ses ${scenes} scènes` : 'sa scène'}` : ''} ? Cette action est irréversible.`,
        confirmLabel: 'Supprimer',
      },
      {width: '420px'},
    ).subscribe((confirme) => {
      if (confirme && vue.chapitre.id) {
        this.enregistrer(this.scenarioService.delete(vue.chapitre.id), 'Impossible de supprimer le chapitre.');
      }
    });
  }

  // ── Les scènes ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  /** Une nouvelle scène, sur la page « Préparer la scène » : elle naît au dernier rang du chapitre, montré au retour. */
  protected nouvelleScene(vue: ChapitreVue): void {
    if (!vue.chapitre.id) {
      return;
    }
    creerUneScene(this.router, vue.chapitre.id, this.retourIci(vue));
  }

  /** « Préparer la scène », sur sa page : décor, ambiance, texte à lire, règles, secret, pistes et personnages. */
  protected preparer(vue: ChapitreVue, scene: BolSceneModel): void {
    preparerLaScene(this.router, scene.id, this.retourIci(vue, scene));
  }

  /** Revenir ici depuis « Préparer la scène » : sur le scénario regardé, le chapitre de la scène montré, et sa carte s'il y en a déjà une. */
  private retourIci(vue: ChapitreVue, scene?: BolSceneModel): string {
    const scenario = this.selection()?.id;
    return this.router.serializeUrl(this.router.createUrlTree(['/library/scenarios'], {queryParams: {scenario, chapitre: vue.id, scene: scene?.id}}));
  }

  /** Une carte déposée : la scène se range dans son chapitre, ou passe à celui où on l'a lâchée. */
  protected deposer(event: CdkDragDrop<ChapitreVue, ChapitreVue, BolSceneModel>): void {
    this.ranger(event.item.data, event.previousContainer.data, event.container.data, event.currentIndex);
  }

  /** Range une scène au rang `index` de `arrivee` (le chapitre où elle est, ou un autre) : le serveur change d'abord son chapitre, puis
   * l'ordre des scènes d'arrivée. La carte y reste en attendant. */
  protected ranger(scene: BolSceneModel, depart: ChapitreVue, arrivee: ChapitreVue, index: number): void {
    const chapitreId = arrivee.chapitre.id;
    const avant = arrivee.scenes.findIndex((s) => s.scene.id === scene.id);
    if (!chapitreId || (depart.id === arrivee.id && avant === index)) {
      return;
    }
    const ids = arrivee.scenes.map((s) => s.scene.id).filter((id) => id !== scene.id);
    ids.splice(Math.max(0, Math.min(index, ids.length)), 0, scene.id);
    this.rangement.update((rangement) => {
      const suivant = new Map(rangement).set(arrivee.id, ids);
      if (depart.id !== arrivee.id) {
        suivant.set(
          depart.id,
          depart.scenes.map((s) => s.scene.id).filter((id) => id !== scene.id),
        );
      }
      return suivant;
    });
    const requete =
      depart.id === arrivee.id
        ? this.sceneService.reorder(chapitreId, ids)
        : this.sceneService.update(scene.id, {scenario_id: chapitreId}).pipe(switchMap(() => this.sceneService.reorder(chapitreId, ids)));
    this.enregistrer(requete, 'Impossible de ranger la scène.');
  }

  protected supprimerScene(scene: BolSceneModel): void {
    confirmDialog(
      this.dialog,
      {title: 'Supprimer la scène', message: `Supprimer « ${scene.titre} » ? Les pistes des autres scènes qui y menaient gardent leur texte.`, confirmLabel: 'Supprimer'},
      {width: '420px'},
    ).subscribe((confirme) => {
      if (confirme) {
        this.enregistrer(this.sceneService.delete(scene.id), 'Impossible de supprimer la scène.');
      }
    });
  }

  private dialogueChapitre(data: ChapitreDialogData): Observable<ChapitreDialogResultat | undefined> {
    return openChapitreDialog(this.dialog, data);
  }

  /** Envoie la modification, relit les chapitres et les scènes ; dit l'erreur du serveur (une partie joue ce chapitre, un homonyme…). */
  private enregistrer<T>(requete: Observable<T>, erreur: string, ensuite?: (resultat: T) => void): void {
    requete.subscribe({
      next: (resultat) => {
        ensuite?.(resultat);
        this.sagasDuCompte.refresh();
        this.chapitres.refresh();
        this.scenes.refresh();
      },
      error: (error: unknown) => {
        this.snackBar.open(extractApiErrorMessage(error, erreur), 'Fermer', {duration: 6000});
        // Ce qu'on a rangé à la main revient comme le serveur l'a gardé.
        this.scenes.refresh();
      },
    });
  }
}
