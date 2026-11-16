import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {apiUrl} from '../../core/api-url';
import {BolSceneModel, BolSceneChanges} from '../models/bol-scene.model';

@Injectable({providedIn: 'root'})
export class BolSceneService {
  private readonly http = inject(HttpClient);
  private readonly base = apiUrl('bol/scene');

  scenes(): Observable<BolSceneModel[]> {
    return this.http.get<BolSceneModel[]>(this.base);
  }

  /** Crée une scène vide, au dernier rang de son chapitre ; elle se prépare ensuite dans « Préparer la scène ». */
  create(titre: string, scenarioId: string | null): Observable<BolSceneModel> {
    return this.http.post<BolSceneModel>(`${this.base}/create`, {titre, scenario_id: scenarioId});
  }

  update(id: string, changes: BolSceneChanges): Observable<BolSceneModel> {
    return this.http.post<BolSceneModel>(`${this.base}/update`, {id, ...changes});
  }

  reorder(scenarioId: string | null, ids: readonly string[]): Observable<boolean> {
    return this.http.patch<boolean>(`${this.base}/ordre`, {scenario_id: scenarioId, ordre: ids});
  }

  delete(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.base}/delete/${id}`);
  }
}
