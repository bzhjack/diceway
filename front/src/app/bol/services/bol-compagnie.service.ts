import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {apiUrl} from '../../core/api-url';
import {BolCompagnieModel} from '../models/bol-compagnie.model';

@Injectable({providedIn: 'root'})
export class BolCompagnieService {
  private readonly http = inject(HttpClient);
  private readonly base = apiUrl('bol/compagnie');

  compagnies(): Observable<BolCompagnieModel[]> {
    return this.http.get<BolCompagnieModel[]>(this.base);
  }

  creer(nom: string, heros: readonly string[]): Observable<BolCompagnieModel> {
    return this.http.post<BolCompagnieModel>(`${this.base}/create`, {nom, heros});
  }

  /** Vaut pour ses prochaines parties : celles déjà commencées gardent leurs héros, et suivent son nom. */
  modifier(id: string, nom: string, heros: readonly string[]): Observable<BolCompagnieModel> {
    return this.http.post<BolCompagnieModel>(`${this.base}/update`, {id, nom, heros});
  }

  /** Refusée tant que la compagnie a des parties. */
  supprimer(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.base}/delete/${id}`);
  }
}
