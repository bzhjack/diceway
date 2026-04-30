import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

export interface BolCombatOptionModel {
  id: number;
  label: string;
  slug: string;
  modificateur: number;
  modificateur_armor: boolean;
  note: string;
  ordre: number;
}

export interface BolHeroicOptionModel {
  id: number;
  label: string;
  slug: string;
  description: string;
  ordre: number;
}

export interface BolDifficulteModel {
  id: number;
  label: string;
  modificateur: number;
  ordre: number;
}

@Injectable({providedIn: 'root'})
export class BolCombatReferenceService {
  private readonly http = inject(HttpClient);

  getCombatOptions(): Observable<BolCombatOptionModel[]> {
    return this.http.get<BolCombatOptionModel[]>(`${environment.apiBase}/api/bol/combat/options`);
  }

  getHeroicOptions(): Observable<BolHeroicOptionModel[]> {
    return this.http.get<BolHeroicOptionModel[]>(`${environment.apiBase}/api/bol/combat/heroic-options`);
  }

  getDifficultes(): Observable<BolDifficulteModel[]> {
    return this.http.get<BolDifficulteModel[]>(`${environment.apiBase}/api/bol/combat/difficultes`);
  }
}
