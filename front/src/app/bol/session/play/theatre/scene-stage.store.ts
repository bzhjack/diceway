import {computed, inject, Injectable, signal} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {catchError, defer, finalize, forkJoin, map, Observable, of, Subscription, tap, timer} from 'rxjs';
import {BolSceneLoadResult, BolSceneModel, BolSceneScenarioRef, SceneLoadMode} from '../../../models/bol-scene.model';
import {BolCatalogService} from '../../../services/bol-catalog.service';
import {BolScenarioService} from '../../../services/bol-scenario.service';
import {BolSceneService} from '../../../services/bol-scene.service';
import {RideauEtat, SceneActe, SceneCarton} from '../../models/theatre.model';
import {SceneActionsService} from '../../scene-actions.service';
import {scenesOf} from '../scene-list/scene.util';
import {openSceneEditor} from './scene-editor-dialog/scene-editor-dialog';
import {CARTON_RYTHME, cartonTenue, sceneActs} from './theatre.util';

/** Pause, rideau fermé, avant qu'il ne se rouvre sur la nouvelle scène. */
const RIDEAU_PAUSE_MS = 250;
/** Au plus, le temps d'attendre que la page montre la session chargée avant de rouvrir le rideau. */
const RIDEAU_ATTENTE_MAX_MS = 3000;

/** L'utilisateur demande moins d'animations. */
function mouvementReduit(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Durées du rideau : nulles quand l'utilisateur demande moins d'animations. */
function rideauDurees(reduit: boolean): {readonly fermeture: number; readonly pause: number} {
  return reduit ? {fermeture: 0, pause: 0} : {fermeture: CARTON_RYTHME.fondu, pause: RIDEAU_PAUSE_MS};
}

/**
 * Les scènes vues depuis la table : la frise des actes du scénario affiché, la scène courante et sa
 * préparation, les noms des régions, et le rideau qui se ferme pendant un changement de scène. Fourni par
 * la page de la table (une instance par table), partagé par l'en-tête et le plateau. La page l'informe
 * de chaque session chargée (`sync`) et recharge elle-même la session après un chargement de scène.
 */
@Injectable()
export class SceneStageStore {
  private readonly sceneService = inject(BolSceneService);
  private readonly scenarioService = inject(BolScenarioService);
  private readonly catalog = inject(BolCatalogService);
  private readonly sceneActions = inject(SceneActionsService);
  private readonly dialog = inject(MatDialog);

  private readonly sessionId = signal<string | null>(null);
  private readonly currentSceneId = signal<string | null>(null);
  private readonly played = signal<readonly string[]>([]);

  private readonly scenesState = signal<readonly BolSceneModel[]>([]);
  readonly scenes = this.scenesState.asReadonly();
  private readonly scenariosState = signal<readonly BolSceneScenarioRef[]>([]);
  readonly scenarios = this.scenariosState.asReadonly();
  /** Scénario affiché dans la frise — `null` = « On improvise ». */
  private readonly scenarioIdState = signal<string | null>(null);
  readonly scenarioId = this.scenarioIdState.asReadonly();
  private readonly regionNomsState = signal<ReadonlyMap<number, string>>(new Map());
  readonly regionNoms = this.regionNomsState.asReadonly();

  private readonly rideauState = signal<RideauEtat>('ouvert');
  readonly rideau = this.rideauState.asReadonly();
  /** Le carton du chroniqueur de la scène qui se charge, affiché rideau fermé. */
  private readonly cartonState = signal<SceneCarton | null>(null);
  readonly carton = this.cartonState.asReadonly();
  private readonly busyState = signal(false);
  readonly busy = this.busyState.asReadonly();

  private readonly knownScenarioIds = computed(() => new Set(this.scenarios().map((s) => s.id)));
  readonly acts = computed<readonly SceneActe[]>(() =>
    sceneActs(this.scenes(), this.scenarioId(), this.knownScenarioIds(), this.currentSceneId(), this.played()),
  );
  readonly currentScene = computed(() => this.scenes().find((s) => s.id === this.currentSceneId()) ?? null);
  /** La scène montrée sur le plateau : la scène courante, si elle appartient au scénario affiché dans la frise. Après un
   * changement de scénario, le plateau reste vierge tant qu'aucune de ses scènes n'est chargée ; revenir au scénario de
   * la scène courante la remontre. */
  readonly displayedScene = computed(() => {
    const scene = this.currentScene();
    if (!scene) {
      return null;
    }
    const scenarioId = scene.scenario_id && this.knownScenarioIds().has(scene.scenario_id) ? scene.scenario_id : null;
    return scenarioId === this.scenarioId() ? scene : null;
  });
  /** L'acte en cours, s'il est dans la frise affichée. */
  readonly currentActe = computed(() => this.acts().find((a) => a.statut === 'en-cours') ?? null);

  /** Les scènes ont été demandées au moins une fois. */
  private requested = false;
  private loading = false;
  /** Le scénario de la frise a été choisi d'après la scène courante (au premier chargement seulement). */
  private placed = false;
  private regionsRequested = false;
  /** Une scène est chargée, le rideau attend que la page montre la session à jour (prochain `sync`) : la pause avant
   * de le rouvrir, et la garde qui le rouvre de toute façon au bout de `RIDEAU_ATTENTE_MAX_MS`. */
  private attente: {readonly pause: number; readonly garde: Subscription} | null = null;
  /** Quand le carton aura fini de s'afficher (`Date.now()`) : le rideau ne se rouvre pas avant. */
  private finCarton = 0;
  /** L'annonce de la scène chargée, faite à la réouverture du rideau (pas par-dessus le carton). */
  private annonce: (() => void) | null = null;

  /** Session chargée par la page : sa scène courante et ses scènes jouées. Les scènes sont rechargées au
   * premier appel, ou si la scène courante n'est pas connue (créée depuis la réserve ou la barre de commande). */
  sync(sessionId: string, currentSceneId: string | null, played: readonly string[]): void {
    this.sessionId.set(sessionId);
    this.currentSceneId.set(currentSceneId);
    this.played.set(played);
    if (this.attente) {
      // La page montre la session chargée : le rideau peut se rouvrir sur la nouvelle scène.
      const {pause, garde} = this.attente;
      this.attente = null;
      garde.unsubscribe();
      this.rouvrir(pause);
    }
    const unknown = currentSceneId !== null && !this.scenes().some((s) => s.id === currentSceneId);
    if (!this.requested || (unknown && !this.loading)) {
      this.reload();
    }
  }

  /** Recharge scènes et scénarios (et, une seule fois, les noms des régions). */
  reload(): void {
    this.requested = true;
    this.loading = true;
    if (!this.regionsRequested) {
      this.regionsRequested = true;
      this.catalog
        .regions()
        .pipe(catchError(() => of([])))
        .subscribe((regions) => this.regionNomsState.set(new Map(regions.map((r) => [Number(r.id), r.region]))));
    }
    forkJoin({
      scenes: this.sceneService.scenes().pipe(catchError(() => of(this.scenes()))),
      scenarios: this.scenarioService.scenarios().pipe(catchError(() => of(null))),
    }).subscribe(({scenes, scenarios}) => {
      this.loading = false;
      this.scenesState.set(scenes);
      if (scenarios) {
        this.scenariosState.set(scenarios.filter((s): s is typeof s & {id: string} => !!s.id).map((s) => ({id: s.id, titre: s.titre})));
      }
      const known = this.knownScenarioIds();
      if (!this.placed) {
        this.placed = true;
        const scenarioId = scenes.find((s) => s.id === this.currentSceneId())?.scenario_id ?? null;
        this.scenarioIdState.set(scenarioId && known.has(scenarioId) ? scenarioId : null);
      } else if (this.scenarioId() && !known.has(this.scenarioId()!)) {
        this.scenarioIdState.set(null);
      }
    });
  }

  selectScenario(id: string | null): void {
    this.scenarioIdState.set(id);
  }

  /** Les autres scènes du scénario d'une scène (« On improvise » compris) — celles vers lesquelles ses pistes
   * peuvent mener —, quel que soit le scénario affiché dans la frise. */
  siblingsOf(scene: BolSceneModel): BolSceneModel[] {
    const known = this.knownScenarioIds();
    const scenarioId = scene.scenario_id && known.has(scene.scenario_id) ? scene.scenario_id : null;
    return scenesOf(this.scenes(), scenarioId, known).filter((s) => s.id !== scene.id);
  }

  /** Nom de la région où se joue une scène — `null` sans région, ou tant que les régions ne sont pas chargées. */
  regionNom(scene: BolSceneModel | null): string | null {
    return scene?.region_id != null ? (this.regionNomsState().get(scene.region_id) ?? null) : null;
  }

  /** « Préparer la scène » : ouvre le dialogue d'édition (ses pistes mènent aux scènes de son propre scénario) et
   * garde la scène enregistrée. */
  prepare(scene: BolSceneModel): void {
    openSceneEditor(this.dialog, {scene, siblings: this.siblingsOf(scene)}).subscribe((updated) => {
      if (updated) {
        this.replaceScene(updated);
      }
    });
  }

  /** Une scène a été modifiée (« Préparer la scène ») : elle remplace l'ancienne dans la liste. */
  replaceScene(updated: BolSceneModel): void {
    this.scenesState.update((list) => list.map((s) => (s.id === updated.id ? updated : s)));
  }

  /** Charge une scène sur la table, rideau fermé : il se ferme (fondu au noir) sur le carton du chroniqueur, la scène se
   * charge, puis il se rouvre une fois la session chargée montrée par la page (son `sync` suivant, au plus
   * `RIDEAU_ATTENTE_MAX_MS`), après une pause et pas avant la fin du carton. En cas d'erreur, il se rouvre après la
   * pause. Émet `null` sans rien faire si un chargement est déjà en cours. */
  load(scene: BolSceneModel, mode: SceneLoadMode): Observable<BolSceneLoadResult | null> {
    return defer(() => {
      const sessionId = this.sessionId();
      if (this.busy() || !sessionId) {
        return of(null);
      }
      this.busyState.set(true);
      const reduit = mouvementReduit();
      const durees = rideauDurees(reduit);
      this.cartonState.set({titre: scene.titre});
      this.finCarton = Date.now() + durees.fermeture + cartonTenue(reduit);
      this.rideauState.set('ferme');
      return forkJoin([timer(durees.fermeture), this.sceneActions.loadAs(sessionId, scene, mode, false)]).pipe(
        map(([, result]) => result),
        tap({
          // Avant que l'appelant ne reçoive le résultat : la page qui pose la session appellera `sync` ensuite.
          next: (result) => {
            this.annonce = () => this.sceneActions.announceLoad(scene.titre, result);
            this.attendreLaSession(durees.pause);
          },
          error: () => this.rouvrir(durees.pause, false),
        }),
        finalize(() => this.busyState.set(false)),
      );
    });
  }

  private attendreLaSession(pause: number): void {
    this.attente?.garde.unsubscribe();
    const garde = timer(RIDEAU_ATTENTE_MAX_MS).subscribe(() => {
      this.attente = null;
      this.rouvrir(pause);
    });
    this.attente = {pause, garde};
  }

  /** Rouvre le rideau après la pause, et, sauf erreur (`apresCarton` faux), pas avant la fin du carton. */
  private rouvrir(pause: number, apresCarton = true): void {
    const reste = apresCarton ? this.finCarton - Date.now() : 0;
    timer(Math.max(pause, reste)).subscribe(() => {
      this.rideauState.set('ouvert');
      this.annonce?.();
      this.annonce = null;
    });
  }
}
