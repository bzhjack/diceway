import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {apiUrl} from '../../core/api-url';
import {
  BolFightSessionAddCombatantPayload,
  BolFightSessionCreatePayload,
  BolFightSessionHerosModel,
  BolFightSessionModel,
  InitiativeResultat,
} from '../models/bol-fight-session.model';

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

  updateOrder(sessionId: string, ordre: readonly string[]): Observable<BolFightSessionModel> {
    return this.http.patch<BolFightSessionModel>(`${this.base}/${sessionId}/ordre`, {ordre});
  }

  startCombat(sessionId: string): Observable<BolFightSessionModel> {
    return this.http.patch<BolFightSessionModel>(`${this.base}/${sessionId}/start-combat`, {});
  }

  endCombat(sessionId: string): Observable<BolFightSessionModel> {
    return this.http.patch<BolFightSessionModel>(`${this.base}/${sessionId}/end-combat`, {});
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
   * `instanceIndex` cible une seule instance d'un lot de créatures/démons (qty > 1) — sans lui,
   * toutes les instances du lot partageraient les mêmes PV.
   */
  applyDamage(
    sessionId: string,
    kind: BolFightSessionAddCombatantPayload['kind'],
    pivotId: number,
    delta: number,
    instanceIndex?: number | null,
  ): Observable<BolFightSessionModel> {
    return this.http.patch<BolFightSessionModel>(`${this.base}/${sessionId}/combatant/${kind}/${pivotId}/damage`, {
      delta,
      instanceIndex: instanceIndex ?? null,
    });
  }
}
