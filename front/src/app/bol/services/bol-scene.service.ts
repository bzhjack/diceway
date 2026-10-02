import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {apiUrl} from '../../core/api-url';
import {BolSceneModel} from '../models/bol-scene.model';

export interface BolSceneChanges {
  titre?: string;
  notes?: string | null;
  scenario_id?: string | null;
}

@Injectable({providedIn: 'root'})
export class BolSceneService {
  private readonly http = inject(HttpClient);
  private readonly base = apiUrl('bol/scene');

  scenes(): Observable<BolSceneModel[]> {
    return this.http.get<BolSceneModel[]>(this.base);
  }

  /** Crée une scène à partir de l'état actuel de la table (distribution lue côté serveur). */
  create(titre: string, scenarioId: string | null, sessionId: string): Observable<BolSceneModel> {
    return this.http.post<BolSceneModel>(`${this.base}/create`, {
      titre,
      scenario_id: scenarioId,
      session_id: sessionId,
    });
  }

  update(id: string, changes: BolSceneChanges): Observable<BolSceneModel> {
    return this.http.post<BolSceneModel>(`${this.base}/update`, {id, ...changes});
  }

  reorder(scenarioId: string | null, ids: readonly string[]): Observable<boolean> {
    return this.http.patch<boolean>(`${this.base}/ordre`, {scenario_id: scenarioId, ordre: ids});
  }

  /** Remplace la distribution de la scène par l'état actuel de la table. */
  replaceDistribution(id: string, sessionId: string): Observable<BolSceneModel> {
    return this.http.patch<BolSceneModel>(`${this.base}/${id}/distribution`, {session_id: sessionId});
  }

  delete(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.base}/delete/${id}`);
  }
}
