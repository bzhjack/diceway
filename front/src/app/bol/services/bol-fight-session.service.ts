import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {apiUrl} from '../../core/api-url';
import {
  BolFightSessionAddCombatantPayload,
  BolFightSessionCreatePayload,
  BolFightSessionHerosModel,
  BolFightSessionModel,
  CombatCamp,
  EtatCombatDto,
  InitiativeResultat,
} from '../models/bol-fight-session.model';
import {BolSceneLoadResult, SceneLoadMode} from '../models/bol-scene.model';

@Injectable({providedIn: 'root'})
export class BolFightSessionService {
  private readonly http = inject(HttpClient);
  private readonly base = apiUrl('bol/fight-session');

  fightSessions(): Observable<BolFightSessionModel[]> {
    return this.http.get<BolFightSessionModel[]>(this.base);
  }

  fightSession(id: string): Observable<BolFightSessionModel> {
    return this.http.get<BolFightSessionModel>(`${this.base}/${id}`);
  }

  create(payload: BolFightSessionCreatePayload): Observable<BolFightSessionModel> {
    return this.http.post<BolFightSessionModel>(`${this.base}/create`, payload);
  }

  delete(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.base}/delete/${id}`);
  }

  addCombatant(sessionId: string, payload: BolFightSessionAddCombatantPayload): Observable<BolFightSessionModel> {
    return this.http.post<BolFightSessionModel>(`${this.base}/${sessionId}/combatant`, payload);
  }

  removeCombatant(
    sessionId: string,
    kind: BolFightSessionAddCombatantPayload['kind'],
    pivotId: number,
  ): Observable<BolFightSessionModel> {
    return this.http.delete<BolFightSessionModel>(`${this.base}/${sessionId}/combatant/${kind}/${pivotId}`);
  }

  /** Passe un PNJ, une créature ou un démon du côté des héros (allié) ou le remet avec les présents. */
  setCamp(
    sessionId: string,
    kind: BolFightSessionAddCombatantPayload['kind'],
    pivotId: number,
    camp: CombatCamp,
  ): Observable<BolFightSessionModel> {
    return this.http.patch<BolFightSessionModel>(`${this.base}/${sessionId}/combatant/${kind}/${pivotId}/camp`, {camp});
  }

  updateOrder(sessionId: string, ordre: readonly string[]): Observable<BolFightSessionModel> {
    return this.http.patch<BolFightSessionModel>(`${this.base}/${sessionId}/ordre`, {ordre});
  }

  updatePositions(
    sessionId: string,
    positions: Readonly<Record<string, {x: number; y: number}>>,
  ): Observable<BolFightSessionModel> {
    return this.http.patch<BolFightSessionModel>(`${this.base}/${sessionId}/positions`, {positions});
  }

  startCombat(sessionId: string): Observable<BolFightSessionModel> {
    return this.http.patch<BolFightSessionModel>(`${this.base}/${sessionId}/start-combat`, {});
  }

  endCombat(sessionId: string): Observable<BolFightSessionModel> {
    return this.http.patch<BolFightSessionModel>(`${this.base}/${sessionId}/end-combat`, {});
  }

  /** Enregistre l'état du combat (round, cartes qui ont joué, cartes en défense totale). */
  updateCombatState(sessionId: string, etat: EtatCombatDto): Observable<BolFightSessionModel> {
    return this.http.patch<BolFightSessionModel>(`${this.base}/${sessionId}/etat-combat`, etat);
  }

  /** Charge une scène sur la table (opération serveur unique) — cf. `BolSceneService` côté backend. */
  loadScene(sessionId: string, sceneId: string, mode: SceneLoadMode): Observable<BolSceneLoadResult> {
    return this.http.post<BolSceneLoadResult>(`${this.base}/${sessionId}/load-scene`, {scene_id: sceneId, mode});
  }

  /** Résultat du jet de réaction d'un héros déjà présent dans la session (endpoint backend existant, jamais câblé côté front jusqu'ici). */
  updateHeroInitiative(
    sessionId: string,
    herosPivotId: number,
    resultat: InitiativeResultat | null,
  ): Observable<BolFightSessionHerosModel> {
    return this.http.patch<BolFightSessionHerosModel>(`${this.base}/${sessionId}/heros/${herosPivotId}/initiative`, {
      resultat,
    });
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
    return this.http.patch<BolFightSessionModel>(`${this.base}/${sessionId}/combatant/${kind}/${pivotId}/damage`, {delta});
  }
}
