import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {BolCreatureCapaciteModel, BolCreatureModel, BolCreatureTailleModel} from "../models/bol-creature.model";
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BolCreaturesService {

  constructor(private http: HttpClient) {
  }


  creatures(): Observable<BolCreatureModel[]> {
    return this.http.get<BolCreatureModel[]>(`${environment.apiBase}/api/bol/creature`);
  }

  creature(id: string, questId?: string): Observable<BolCreatureModel> {
    return this.http.get<BolCreatureModel>(`${environment.apiBase}/api/bol/creature/` + id + (questId ? '?questId=' + questId : ''));
  }


  tailles(): Observable<BolCreatureTailleModel[]> {
    return this.http.get<BolCreatureTailleModel[]>(`${environment.apiBase}/api/bol/creature/tailles`);
  }

  capacites(): Observable<BolCreatureCapaciteModel[]> {
    return this.http.get<BolCreatureCapaciteModel[]>(`${environment.apiBase}/api/bol/creature/capacites`);
  }

  createCreature(creature: BolCreatureModel): Observable<any> {
    return this.http.post<BolCreatureModel>(`${environment.apiBase}/api/bol/creature/create`, <BolCreatureModel>creature);
  }

  updateCreature(creature: BolCreatureModel): Observable<any> {
    return this.http.post<BolCreatureModel>(`${environment.apiBase}/api/bol/creature/update`, <BolCreatureModel>creature);
  }

  deleteCreature(id: string): Observable<any> {
    return this.http.delete<BolCreatureModel>(`${environment.apiBase}/api/bol/creature/delete/` + id);
  }
}
