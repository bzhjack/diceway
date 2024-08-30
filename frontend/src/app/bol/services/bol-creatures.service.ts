import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {BolCreatureModel} from "../models/bol-creature.model";

@Injectable({
  providedIn: 'root'
})
export class BolCreaturesService {

  constructor(private http: HttpClient) {
  }
  creatures(): Observable<BolCreatureModel[]> {
    return this.http.get<BolCreatureModel[]>('/api/bol/creature');
  }
  tailles(): Observable<BolCreatureModel[]> {
    return this.http.get<BolCreatureModel[]>('/api/bol/creature/tailles');
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
