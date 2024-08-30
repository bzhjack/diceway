import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {BolCreatureModel} from "../models/bol-creature.model";
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
  tailles(): Observable<BolCreatureModel[]> {
    return this.http.get<BolCreatureModel[]>('/api/bol/creature/tailles');
  }
  createCreature(creature: BolCreatureModel): Observable<any> {
    return this.http.post<BolCreatureModel>('/api/bol/creature/create', <BolCreatureModel>creature);
  }
}
