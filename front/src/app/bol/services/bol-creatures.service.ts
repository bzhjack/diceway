import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {BolApiMessage} from "../models/bol-api.model";
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

  creature(id: string): Observable<BolCreatureModel> {
    return this.http.get<BolCreatureModel>(`${environment.apiBase}/api/bol/creature/` + id);
  }


  tailles(): Observable<BolCreatureTailleModel[]> {
    return this.http.get<BolCreatureTailleModel[]>(`${environment.apiBase}/api/bol/creature/tailles`);
  }

  capacites(): Observable<BolCreatureCapaciteModel[]> {
    return this.http.get<BolCreatureCapaciteModel[]>(`${environment.apiBase}/api/bol/creature/capacites`);
  }

  createCreature(creature: Record<string, unknown>): Observable<BolCreatureModel> {
    return this.http.post<BolCreatureModel>(
      `${environment.apiBase}/api/bol/creature/create`,
      creature,
    );
  }

  updateCreature(creature: Record<string, unknown>): Observable<BolCreatureModel> {
    return this.http.post<BolCreatureModel>(`${environment.apiBase}/api/bol/creature/update`, creature);
  }

  deleteCreature(id: string): Observable<BolApiMessage> {
    return this.http.delete<BolApiMessage>(`${environment.apiBase}/api/bol/creature/delete/` + id);
  }
}
