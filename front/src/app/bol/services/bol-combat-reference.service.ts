import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {apiUrl} from '../../core/api-url';
import {BolCombatOptionModel} from '../models/bol-combat-reference.model';

@Injectable({providedIn: 'root'})
export class BolCombatReferenceService {
  private readonly http = inject(HttpClient);

  getCombatOptions(): Observable<BolCombatOptionModel[]> {
    return this.http.get<BolCombatOptionModel[]>(apiUrl('bol/combat/options'));
  }
}
