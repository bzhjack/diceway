import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {apiUrl} from '../../core/api-url';
import {
  BolFightSessionAddCombatantPayload,
  BolFightSessionCreatePayload,
  BolFightSessionModel,
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
}
