import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {BolApiMessage} from "../models/bol-api.model";
import {BolCreatureCapaciteModel, BolCreatureModel, BolCreatureTailleModel} from "../models/bol-creature.model";
import {apiUrl} from '../../core/api-url';

@Injectable({
  providedIn: 'root'
})
export class BolCreaturesService {

  private readonly http = inject(HttpClient);


  creatures(): Observable<BolCreatureModel[]> {
    return this.http.get<BolCreatureModel[]>(apiUrl('bol/creature'));
  }

  creature(id: string): Observable<BolCreatureModel> {
    return this.http.get<BolCreatureModel>(apiUrl(`bol/creature/${id}`));
  }


  tailles(): Observable<BolCreatureTailleModel[]> {
    return this.http.get<BolCreatureTailleModel[]>(apiUrl('bol/creature/tailles'));
  }

  capacites(): Observable<BolCreatureCapaciteModel[]> {
    return this.http.get<BolCreatureCapaciteModel[]>(apiUrl('bol/creature/capacites'));
  }

  createCreature(creature: Record<string, unknown>): Observable<BolCreatureModel> {
    return this.http.post<BolCreatureModel>(
      apiUrl('bol/creature/create'),
      creature,
    );
  }

  updateCreature(creature: Record<string, unknown>): Observable<BolCreatureModel> {
    return this.http.post<BolCreatureModel>(apiUrl('bol/creature/update'), creature);
  }

  deleteCreature(id: string): Observable<BolApiMessage> {
    return this.http.delete<BolApiMessage>(apiUrl(`bol/creature/delete/${id}`));
  }
}
