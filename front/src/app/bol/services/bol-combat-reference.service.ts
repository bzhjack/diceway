import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {apiUrl} from '../../core/api-url';
import {BolCombatOptionModel, BolHeroicOptionModel, BolDifficulteModel} from '../models/bol-combat-reference.model';

@Injectable({providedIn: 'root'})
export class BolCombatReferenceService {
  private readonly http = inject(HttpClient);

  getCombatOptions(): Observable<BolCombatOptionModel[]> {
    return this.http.get<BolCombatOptionModel[]>(apiUrl('bol/combat/options'));
  }

  getHeroicOptions(): Observable<BolHeroicOptionModel[]> {
    return this.http.get<BolHeroicOptionModel[]>(apiUrl('bol/combat/heroic-options'));
  }

  getDifficultes(): Observable<BolDifficulteModel[]> {
    return this.http.get<BolDifficulteModel[]>(apiUrl('bol/combat/difficultes'));
  }
}
