import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {BolApiMessage} from '../models/bol-api.model';
import {BolDemonCategorieModel, BolDemonModel, BolDemonPouvoirModel} from '../models/bol-demon.model';
import {apiUrl} from '../../core/api-url';

@Injectable({
  providedIn: 'root'
})
export class BolDemonsService {

  private readonly http = inject(HttpClient);


  demons(): Observable<BolDemonModel[]> {
    return this.http.get<BolDemonModel[]>(apiUrl('bol/demon'));
  }

  demon(id: string): Observable<BolDemonModel> {
    return this.http.get<BolDemonModel>(apiUrl(`bol/demon/${id}`));
  }

  categories(): Observable<BolDemonCategorieModel[]> {
    return this.http.get<BolDemonCategorieModel[]>(apiUrl('bol/demon/categories'));
  }

  pouvoirs(): Observable<BolDemonPouvoirModel[]> {
    return this.http.get<BolDemonPouvoirModel[]>(apiUrl('bol/demon/pouvoirs'));
  }

  createDemon(demon: Record<string, unknown>): Observable<BolDemonModel> {
    return this.http.post<BolDemonModel>(apiUrl('bol/demon/create'), demon);
  }

  updateDemon(demon: Record<string, unknown>): Observable<BolDemonModel> {
    return this.http.post<BolDemonModel>(apiUrl('bol/demon/update'), demon);
  }

  deleteDemon(id: string): Observable<BolApiMessage> {
    return this.http.delete<BolApiMessage>(apiUrl(`bol/demon/delete/${id}`));
  }
}
