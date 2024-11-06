import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {BolCreatureCapaciteModel, BolCreatureModel, BolCreatureTailleModel} from "../models/bol-creature.model";
import {BolHerosModel} from "../models/bol-heros.model";

@Injectable({
  providedIn: 'root'
})
export class BolCreaturesService {

  constructor(private http: HttpClient) {
  }

  creatures(): Observable<BolCreatureModel[]> {
    return this.http.get<BolCreatureModel[]>('/api/bol/creature');
  }

  creature(id: string, questId?: string): Observable<BolCreatureModel> {
    return this.http.get<BolCreatureModel>('/api/bol/creature/' + id + (questId ? '?questId=' + questId : ''));
  }


  tailles(): Observable<BolCreatureTailleModel[]> {
    return this.http.get<BolCreatureTailleModel[]>('/api/bol/creature/tailles');
  }

  capacites(): Observable<BolCreatureCapaciteModel[]> {
    return this.http.get<BolCreatureCapaciteModel[]>('/api/bol/creature/capacites');
  }

  createCreature(creature: BolCreatureModel): Observable<any> {
    return this.http.post<BolCreatureModel>('/api/bol/creature/create', <BolCreatureModel>creature);
  }

  updateCreature(creature: BolCreatureModel): Observable<any> {
    return this.http.post<BolCreatureModel>('/api/bol/creature/update', <BolCreatureModel>creature);
  }

  deleteCreature(id: string): Observable<any> {
    return this.http.delete<BolCreatureModel>('/api/bol/creature/delete/' + id);
  }
}
