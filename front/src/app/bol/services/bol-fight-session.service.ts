import {RessourceMagique} from '../session/models/magie-combat.model';
import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {AsyncSubject, catchError, concatMap, defer, EMPTY, Observable, Subject, tap, throwError, timeout} from 'rxjs';
import {apiUrl} from '../../core/api-url';
import {
  BolFightSessionAddCombatantPayload,
  BolFightSessionHerosModel,
  BolFightSessionModel,
  BolFightSessionSummaryModel,
  CombatantAttitude,
  CombatCamp,
  EtatCombatDto,
  InitiativeResultat,
} from '../models/bol-fight-session.model';
import {BolSceneLoadResult, SceneLoadMode} from '../models/bol-scene.model';

/** Délai d'un appel sur la table : passé ce délai sans réponse, l'appel échoue (comme une erreur réseau) et la file repart. */
export const DELAI_APPEL_TABLE_MS = 15_000;

@Injectable({providedIn: 'root'})
export class BolFightSessionService {
  private readonly http = inject(HttpClient);
  private readonly base = apiUrl('bol/fight-session');
  private readonly calls = new Subject<Observable<unknown>>();

  constructor() {
    // L'échec d'un appel regarde son appelant : le suivant part quand même.
    this.calls.pipe(concatMap((call) => call.pipe(catchError(() => EMPTY)))).subscribe();
  }

  /** Les appels sur une table partent un à un : l'API les traite en parallèle, et une écriture doublée par une autre renverrait
   * une table sans elle. Chaque réponse porte ainsi tout ce qui la précède et peut remplacer la session sans autre requête. Un appel
   * sans réponse au bout de `DELAI_APPEL_TABLE_MS` est abandonné : il échoue comme une erreur réseau, sans corps (l'appelant affiche son
   * message habituel), et la file repart au lieu de rester bloquée derrière lui. */
  private inOrder<T>(call: Observable<T>): Observable<T> {
    return defer(() => {
      const result = new AsyncSubject<T>();
      // Pas `tap(result)` : `tap` appellerait aussi `subscribe` sur le sujet, et son erreur partirait sans personne pour la recevoir.
      this.calls.next(
        call.pipe(
          timeout({first: DELAI_APPEL_TABLE_MS, with: () => throwError(() => new HttpErrorResponse({status: 0, statusText: 'Délai dépassé'}))}),
          tap({
            next: (value) => result.next(value),
            error: (error: unknown) => result.error(error),
            complete: () => result.complete(),
          }),
        ),
      );
      return result;
    });
  }

  /** Les sessions du compte, sans leur table : de quoi les lister et trouver celle à rouvrir. */
  fightSessions(): Observable<BolFightSessionSummaryModel[]> {
    return this.http.get<BolFightSessionSummaryModel[]>(this.base);
  }

  fightSession(id: string): Observable<BolFightSessionModel> {
    return this.inOrder(this.http.get<BolFightSessionModel>(`${this.base}/${id}`));
  }

  /** Une nouvelle partie : cette compagnie (son nom, ses héros d'aujourd'hui) sur ce chapitre (null : on improvise). */
  creerPartie(compagnieId: string, scenarioId: string | null): Observable<BolFightSessionModel> {
    return this.http.post<BolFightSessionModel>(`${this.base}/create`, {compagnie_id: compagnieId, scenario_id: scenarioId});
  }

  delete(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.base}/delete/${id}`);
  }

  addCombatant(sessionId: string, payload: BolFightSessionAddCombatantPayload): Observable<BolFightSessionModel> {
    return this.inOrder(this.http.post<BolFightSessionModel>(`${this.base}/${sessionId}/combatant`, payload));
  }

  removeCombatant(
    sessionId: string,
    kind: BolFightSessionAddCombatantPayload['kind'],
    pivotId: number,
  ): Observable<BolFightSessionModel> {
    return this.inOrder(this.http.delete<BolFightSessionModel>(`${this.base}/${sessionId}/combatant/${kind}/${pivotId}`));
  }

  /** Passe un PNJ, une créature ou un démon du côté des héros (allié) ou le remet avec les présents. */
  setCamp(
    sessionId: string,
    kind: BolFightSessionAddCombatantPayload['kind'],
    pivotId: number,
    camp: CombatCamp,
  ): Observable<BolFightSessionModel> {
    return this.inOrder(this.http.patch<BolFightSessionModel>(`${this.base}/${sessionId}/combatant/${kind}/${pivotId}/camp`, {camp}));
  }

  /** Attitude d'un PNJ, d'une créature ou d'un démon envers les héros (`null` : aucune). */
  setAttitude(
    sessionId: string,
    kind: 'pnj' | 'creature' | 'demon',
    pivotId: number,
    attitude: CombatantAttitude | null,
  ): Observable<BolFightSessionModel> {
    return this.inOrder(this.http.patch<BolFightSessionModel>(`${this.base}/${sessionId}/combatant/${kind}/${pivotId}/attitude`, {attitude}));
  }

  /** Dépense (négatif) ou rend des points de vilénie à un PNJ rival de la table. */
  adjustVilenie(sessionId: string, pivotId: number, delta: number): Observable<BolFightSessionModel> {
    return this.inOrder(this.http.patch<BolFightSessionModel>(`${this.base}/${sessionId}/combatant/pnj/${pivotId}/vilenie`, {delta}));
  }

  /** « Fuite opportune » : le rival adverse dépense 1 point de vilénie et quitte le combat. Le serveur fait les deux ensemble (ou aucun). */
  fuiteOpportune(sessionId: string, pivotId: number): Observable<BolFightSessionModel> {
    return this.inOrder(this.http.patch<BolFightSessionModel>(`${this.base}/${sessionId}/combatant/pnj/${pivotId}/fuite`, {}));
  }

  /** Points de foi ou de pouvoir d'un PNJ de la table dépensés (négatif) ou rendus, sur sa ligne. */
  adjustPnjRessource(sessionId: string, pivotId: number, ressource: RessourceMagique, delta: number): Observable<BolFightSessionModel> {
    return this.inOrder(this.http.patch<BolFightSessionModel>(`${this.base}/${sessionId}/combatant/pnj/${pivotId}/ressource`, {ressource, delta}));
  }

  updateOrder(sessionId: string, ordre: readonly string[]): Observable<BolFightSessionModel> {
    return this.inOrder(this.http.patch<BolFightSessionModel>(`${this.base}/${sessionId}/ordre`, {ordre}));
  }

  updatePositions(
    sessionId: string,
    positions: Readonly<Record<string, {x: number; y: number}>>,
  ): Observable<BolFightSessionModel> {
    return this.inOrder(this.http.patch<BolFightSessionModel>(`${this.base}/${sessionId}/positions`, {positions}));
  }

  /** Démarre le combat. `exclus` : clés de carte (`{kind}-{pivotId}`) laissées sur la table mais hors de ce combat. */
  startCombat(sessionId: string, exclus: readonly string[] = []): Observable<BolFightSessionModel> {
    return this.inOrder(this.http.patch<BolFightSessionModel>(`${this.base}/${sessionId}/start-combat`, {exclus}));
  }

  endCombat(sessionId: string): Observable<BolFightSessionModel> {
    return this.inOrder(this.http.patch<BolFightSessionModel>(`${this.base}/${sessionId}/end-combat`, {}));
  }

  /** Passe la partie sur un autre chapitre de son scénario, et charge sa première scène : les héros restent, les figurants de l'ancienne
   * scène partent (une partie improvisée qui reçoit son scénario ne perd rien). */
  changerChapitre(sessionId: string, scenarioId: string | null): Observable<BolFightSessionModel> {
    return this.inOrder(this.http.patch<BolFightSessionModel>(`${this.base}/${sessionId}/scenario`, {scenario_id: scenarioId}));
  }

  /** On entre à la table : elle devient la dernière partie jouée, et charge la première scène de son chapitre si elle n'en a aucune. Aucune
   * autre partie n'en est touchée. */
  jouer(sessionId: string): Observable<BolFightSessionModel> {
    return this.inOrder(this.http.patch<BolFightSessionModel>(`${this.base}/${sessionId}/jouer`, {}));
  }

  /** Enregistre l'état du combat (round, cartes qui ont joué, cartes en défense totale). */
  updateCombatState(sessionId: string, etat: EtatCombatDto): Observable<BolFightSessionModel> {
    return this.inOrder(this.http.patch<BolFightSessionModel>(`${this.base}/${sessionId}/etat-combat`, etat));
  }

  /** Charge une scène sur la table (opération serveur unique) — cf. `BolSceneService` côté backend. */
  loadScene(sessionId: string, sceneId: string, mode: SceneLoadMode): Observable<BolSceneLoadResult> {
    return this.inOrder(this.http.post<BolSceneLoadResult>(`${this.base}/${sessionId}/load-scene`, {scene_id: sceneId, mode}));
  }

  /** Résultat du jet de réaction d'un héros déjà présent dans la session (endpoint backend existant, jamais câblé côté front jusqu'ici). */
  updateHeroInitiative(
    sessionId: string,
    herosPivotId: number,
    resultat: InitiativeResultat | null,
  ): Observable<BolFightSessionHerosModel> {
    return this.inOrder(this.http.patch<BolFightSessionHerosModel>(`${this.base}/${sessionId}/heros/${herosPivotId}/initiative`, {
      resultat,
    }));
  }

  /**
   * Applique une variation de vitalité (négative = dégâts, positive = soin), bornée à [0, max].
   */
  applyDamage(
    sessionId: string,
    kind: BolFightSessionAddCombatantPayload['kind'],
    pivotId: number,
    delta: number,
  ): Observable<BolFightSessionModel> {
    return this.inOrder(this.http.patch<BolFightSessionModel>(`${this.base}/${sessionId}/combatant/${kind}/${pivotId}/damage`, {delta}));
  }
}
