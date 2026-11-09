import {ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, viewChild} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatCard} from '@angular/material/card';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {Observable} from 'rxjs';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {readReturnUrl} from '../../../core/return-url.util';
import {confirmDialog} from '../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {DwCompactBarComponent} from '../../../shared/dw-compact-bar/dw-compact-bar';
import {DwLibraryHeaderComponent} from '../../../shared/dw-library-header/dw-library-header';
import {promptDialog} from '../../../shared/dw-prompt-dialog/dw-prompt-dialog';
import {DwTagComponent} from '../../../shared/dw-tag/dw-tag';
import {refreshableResource} from '../../../shared/refreshable-resource';
import {BolScenarioModel} from '../../models/bol-scenario.model';
import {BolSceneModel} from '../../models/bol-scene.model';
import {BolScenarioService} from '../../services/bol-scenario.service';
import {BolSceneService} from '../../services/bol-scene.service';
import {openSceneEditor} from '../../session/play/theatre/scene-editor-dialog/scene-editor-dialog';
import {METEOS, MOMENTS} from '../../session/play/theatre/theatre.util';
import {libelleDeChapitre} from '../../session/scenario.util';
import {ChapitreDialogData, ChapitreDialogResultat} from '../models/chapitre-dialog.model';
import {openChapitreDialog} from './chapitre-dialog/chapitre-dialog';

/** Une scène sur la ligne de son chapitre : son ambiance et son nombre de figurants, prêts à afficher. */
interface SceneVue {
  readonly scene: BolSceneModel;
  readonly ambiance: string;
  readonly figurants: number;
}

interface ChapitreVue {
  readonly id: string;
  readonly chapitre: BolScenarioModel;
  readonly libelle: string;
  readonly scenes: readonly SceneVue[];
}

/** Un scénario (une saga, ou un one shot : son propre et seul chapitre). */
interface ScenarioVue {
  readonly id: string;
  readonly titre: string;
  readonly oneShot: boolean;
  readonly chapitres: readonly ChapitreVue[];
  readonly nombreDeScenes: number;
}

/** L'introduction d'abord, puis les chapitres par numéro, puis ceux sans numéro par nom. */
function comparerChapitres(a: BolScenarioModel, b: BolScenarioModel): number {
  const rang = (n: number | null | undefined) => n ?? Number.MAX_SAFE_INTEGER;
  return rang(a.numero) - rang(b.numero) || a.titre.localeCompare(b.titre, 'fr');
}

/** Le titre d'un seul tenant que le serveur découpe : « Perle du Beshaar — 1. Sacrilège à Satarla » ; un one shot, son nom seul. */
function titreComplet(scenario: string | null, numero: number | null, titre: string): string {
  const libelle = libelleDeChapitre(numero, titre);
  return scenario ? `${scenario} — ${libelle}` : libelle;
}

function sceneVue(scene: BolSceneModel): SceneVue {
  const moment = MOMENTS.find((m) => m.value === scene.moment)?.label;
  const meteo = METEOS.find((m) => m.value === scene.meteo)?.label;
  return {
    scene,
    ambiance: [moment, meteo].filter(Boolean).join(' · '),
    figurants: scene.distribution.reduce((total, entree) => total + (entree.qty ?? 1), 0),
  };
}

/**
 * La bibliothèque des scénarios : à gauche les scénarios du compte (ses sagas, puis ses one shots), à droite celui choisi, ses chapitres et
 * leurs scènes. Tout s'y crée, s'y renomme, s'y supprime : un scénario naît avec son premier chapitre ; une scène y naît vide, se prépare
 * (décor, texte à lire, pistes) avec l'éditeur de la table et se range ; ses figurants se posent ensuite à la table.
 */
@Component({
  selector: 'bol-scenario-library-page',
  imports: [RouterLink, MatButtonModule, MatCard, MatIconModule, MatTooltipModule, DwCompactBarComponent, DwLibraryHeaderComponent, DwTagComponent],
  templateUrl: './scenario-library-page.html',
  styleUrl: './scenario-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScenarioLibraryPageComponent {
  private readonly scenarioService = inject(BolScenarioService);
  private readonly sceneService = inject(BolSceneService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly chapitres = refreshableResource(() => this.scenarioService.scenarios());
  private readonly scenes = refreshableResource(() => this.sceneService.scenes());

  protected readonly returnUrl = signal(readReturnUrl());
  /** L'en-tête de la page, que la barre compacte remplace une fois sorti de l'écran. */
  protected readonly entete = viewChild<DwLibraryHeaderComponent, ElementRef<HTMLElement>>(DwLibraryHeaderComponent, {read: ElementRef});

  private readonly choisi = signal<string | null>(null);

  /** Les scénarios : les sagas par nom, puis les one shots par nom ; chacun avec ses chapitres dans l'ordre et leurs scènes par rang. */
  protected readonly scenarios = computed((): ScenarioVue[] => {
    const scenesParChapitre = new Map<string, BolSceneModel[]>();
    for (const scene of this.scenes.data()) {
      if (scene.scenario_id) {
        scenesParChapitre.set(scene.scenario_id, [...(scenesParChapitre.get(scene.scenario_id) ?? []), scene]);
      }
    }
    const vue = (chapitre: BolScenarioModel): ChapitreVue => ({
      id: chapitre.id ?? '',
      chapitre,
      libelle: libelleDeChapitre(chapitre.numero, chapitre.titre),
      scenes: [...(scenesParChapitre.get(chapitre.id ?? '') ?? [])].sort((a, b) => a.ordre - b.ordre).map(sceneVue),
    });
    const scenario = (id: string, titre: string, oneShot: boolean, chapitres: BolScenarioModel[]): ScenarioVue => {
      const vues = [...chapitres].sort(comparerChapitres).map(vue);
      return {id, titre, oneShot, chapitres: vues, nombreDeScenes: vues.reduce((n, c) => n + c.scenes.length, 0)};
    };

    const sagas = new Map<string, {titre: string; chapitres: BolScenarioModel[]}>();
    const oneShots: ScenarioVue[] = [];
    for (const chapitre of this.chapitres.data()) {
      if (chapitre.saga) {
        const saga = sagas.get(chapitre.saga.id) ?? {titre: chapitre.saga.titre, chapitres: []};
        saga.chapitres.push(chapitre);
        sagas.set(chapitre.saga.id, saga);
      } else if (chapitre.id) {
        oneShots.push(scenario(chapitre.id, chapitre.titre, true, [chapitre]));
      }
    }
    const parNom = (a: ScenarioVue, b: ScenarioVue) => a.titre.localeCompare(b.titre, 'fr');
    return [...[...sagas].map(([id, saga]) => scenario(id, saga.titre, false, saga.chapitres)).sort(parNom), ...oneShots.sort(parNom)];
  });

  protected readonly sagas = computed(() => this.scenarios().filter((s) => !s.oneShot));
  protected readonly oneShots = computed(() => this.scenarios().filter((s) => s.oneShot));

  /** Le scénario montré : celui choisi, sinon le premier. */
  protected readonly selection = computed(() => this.scenarios().find((s) => s.id === this.choisi()) ?? this.scenarios()[0] ?? null);

  protected choisir(id: string): void {
    this.choisi.set(id);
  }

  /** Les chapitres dépliés, par id : tous repliés à l'arrivée, chacun s'ouvre et se ferme seul. */
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

  private deplier(id: string): void {
    this.ouverts.update((ouverts) => (ouverts.has(id) ? ouverts : new Set([...ouverts, id])));
  }

  // ── Les scénarios ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

  /** Un nouveau scénario naît avec son premier chapitre ; un one shot est un scénario d'un seul chapitre, sans numéro. */
  protected nouveauScenario(oneShot: boolean): void {
    this.dialogueChapitre({
      titre: oneShot ? 'Nouveau one shot' : 'Nouveau scénario',
      confirmLabel: 'Créer',
      nommerLeScenario: !oneShot,
      scenario: null,
      oneShot,
      numero: oneShot ? null : 1,
      chapitre: '',
      pitch: '',
    }).subscribe((resultat) => {
      if (resultat) {
        const titre = titreComplet(resultat.scenario, resultat.numero, resultat.titre);
        this.enregistrer(this.scenarioService.create({titre, pitch: resultat.pitch || null}), 'Impossible de créer le scénario.', (chapitre) =>
          this.choisi.set(chapitre.saga?.id ?? chapitre.id),
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
    confirmDialog(
      this.dialog,
      {
        title: scenario.oneShot ? 'Supprimer le one shot' : 'Supprimer le scénario',
        message: scenario.oneShot
          ? `Supprimer « ${scenario.titre} » et ${scenes > 1 ? `ses ${scenes} scènes` : scenes === 1 ? 'sa scène' : 'ce qu’il contient'} ? Cette action est irréversible.`
          : `Supprimer « ${scenario.titre} », ${chapitres > 1 ? `ses ${chapitres} chapitres` : 'son chapitre'} et ${scenes > 1 ? `leurs ${scenes} scènes` : scenes === 1 ? 'sa scène' : 'leurs scènes'} ? Cette action est irréversible.`,
        confirmLabel: 'Supprimer',
      },
      {width: '440px'},
    ).subscribe((confirme) => {
      if (confirme) {
        const suppression = scenario.oneShot ? this.scenarioService.delete(scenario.id) : this.scenarioService.supprimerScenario(scenario.id);
        this.enregistrer(suppression, 'Impossible de supprimer le scénario.', () => this.choisi.set(null));
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
      nommerLeScenario: false,
      scenario: scenario.titre,
      oneShot: false,
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
      titre: scenario.oneShot ? 'Modifier le one shot' : 'Modifier le chapitre',
      confirmLabel: 'Enregistrer',
      nommerLeScenario: false,
      scenario: scenario.oneShot ? null : scenario.titre,
      oneShot: scenario.oneShot,
      numero: chapitre.numero ?? null,
      chapitre: chapitre.titre,
      pitch: chapitre.pitch ?? '',
    }).subscribe((resultat) => {
      if (resultat) {
        const titre = titreComplet(scenario.oneShot ? null : scenario.titre, resultat.numero, resultat.titre);
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

  /** Une scène vide, au dernier rang du chapitre, qui se déplie pour la montrer : elle se prépare ensuite, ses figurants se posent à la table. */
  protected nouvelleScene(vue: ChapitreVue): void {
    promptDialog(this.dialog, {title: 'Nouvelle scène', label: 'Titre de la scène', maxLength: 120, confirmLabel: 'Créer'}).subscribe((titre) => {
      if (titre && vue.chapitre.id) {
        this.enregistrer(this.sceneService.create(titre, vue.chapitre.id, null), 'Impossible de créer la scène.', () => this.deplier(vue.id));
      }
    });
  }

  /** « Préparer la scène », l'éditeur de la table : décor, ambiance, texte à lire, règles, secret et pistes vers les autres scènes. */
  protected preparer(vue: ChapitreVue, scene: BolSceneModel): void {
    openSceneEditor(this.dialog, {scene, siblings: vue.scenes.map((s) => s.scene)}).subscribe((enregistree) => {
      if (enregistree) {
        this.scenes.refresh();
      }
    });
  }

  /** Monte (-1) ou descend (+1) une scène dans son chapitre. */
  protected deplacer(vue: ChapitreVue, index: number, sens: -1 | 1): void {
    const ids = vue.scenes.map((s) => s.scene.id);
    const cible = index + sens;
    if (cible < 0 || cible >= ids.length || !vue.chapitre.id) {
      return;
    }
    [ids[index], ids[cible]] = [ids[cible], ids[index]];
    this.enregistrer(this.sceneService.reorder(vue.chapitre.id, ids), 'Impossible de ranger la scène.');
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
        this.chapitres.refresh();
        this.scenes.refresh();
      },
      error: (error: unknown) => this.snackBar.open(extractApiErrorMessage(error, erreur), 'Fermer', {duration: 6000}),
    });
  }
}
