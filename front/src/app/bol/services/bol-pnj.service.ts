import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {apiUrl} from '../../core/api-url';
import {BolApiMessage} from '../models/bol-api.model';
import {BolHerosModel} from '../models/bol-heros.model';

/** PNJ (création rapide) — mêmes modèles que les héros, endpoints dédiés. */
@Injectable({
  providedIn: 'root',
})
export class BolPnjService {
  private readonly http = inject(HttpClient);

  pnjs(): Observable<BolHerosModel[]> {
    return this.http.get<BolHerosModel[]>(apiUrl('bol/pnj'));
  }

  pnj(id: string): Observable<BolHerosModel> {
    return this.http.get<BolHerosModel>(apiUrl(`bol/pnj/${id}`));
  }

  createPnj(pnj: Record<string, unknown>): Observable<BolHerosModel> {
    return this.http.post<BolHerosModel>(apiUrl('bol/pnj/create'), pnj);
  }

  updatePnj(pnj: Record<string, unknown>): Observable<BolHerosModel> {
    return this.http.post<BolHerosModel>(apiUrl('bol/pnj/update'), pnj);
  }

  deletePnj(id: string): Observable<BolApiMessage> {
    return this.http.delete<BolApiMessage>(apiUrl(`bol/pnj/delete/${id}`));
  }
}
