import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {BolDemonCategorieModel, BolDemonModel, BolDemonPouvoirModel} from '../bol-models/bol-demon.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BolDemonsService {

  constructor(private http: HttpClient) {
  }


  demons(): Observable<BolDemonModel[]> {
    return this.http.get<BolDemonModel[]>(`${environment.apiBase}/api/bol/demon`);
  }

  creature(id: string, questId?: string): Observable<BolDemonModel> {
    return this.http.get<BolDemonModel>(`${environment.apiBase}/api/bol/demon/` + id + (questId ? '?questId=' + questId : ''));
  }

  categories(): Observable<BolDemonCategorieModel[]> {
    return this.http.get<BolDemonCategorieModel[]>(`${environment.apiBase}/api/bol/demon/categories`);
  }

  pouvoirs(): Observable<BolDemonPouvoirModel[]> {
    return this.http.get<BolDemonPouvoirModel[]>(`${environment.apiBase}/api/bol/demon/pouvoirs`);
  }

  createDemon(demon: BolDemonModel): Observable<BolDemonModel> {
    return this.http.post<BolDemonModel>(`${environment.apiBase}/api/bol/demon/create`, <BolDemonModel>demon);
  }

  updateDemon(demon: BolDemonModel): Observable<BolDemonModel> {
    return this.http.post<BolDemonModel>(`${environment.apiBase}/api/bol/demon/update`, <BolDemonModel>demon);
  }

  deleteDemon(id: string): Observable<BolDemonModel> {
    return this.http.delete<BolDemonModel>(`${environment.apiBase}/api/bol/demon/delete/` + id);
  }
}
