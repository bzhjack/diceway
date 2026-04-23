import {Injectable, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {BolScenarioModel} from '../models/bol-scenario.model';
import {environment} from '../../../environments/environment';

@Injectable({providedIn: 'root'})
export class BolScenarioService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBase}/api/bol/scenario`;

  scenarios(): Observable<BolScenarioModel[]> {
    return this.http.get<BolScenarioModel[]>(this.base);
  }

  scenario(id: string): Observable<BolScenarioModel> {
    return this.http.get<BolScenarioModel>(`${this.base}/${id}`);
  }

  create(data: Record<string, unknown>): Observable<BolScenarioModel> {
    return this.http.post<BolScenarioModel>(`${this.base}/create`, data);
  }

  update(data: Record<string, unknown>): Observable<BolScenarioModel> {
    return this.http.post<BolScenarioModel>(`${this.base}/update`, data);
  }

  delete(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.base}/delete/${id}`);
  }
}
