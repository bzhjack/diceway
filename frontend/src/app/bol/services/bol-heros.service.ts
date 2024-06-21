import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {BolHerosModel} from "../models/bol-heros.model";
import {BolRegionModel} from "../models/bol-region.model";
import {BolAvantageModel} from "../models/bol-avantage.model";
import {BolDesavantageModel} from "../models/bol-desavantage.model";

@Injectable({
  providedIn: 'root'
})
export class BolHerosService {

  constructor(private http: HttpClient) {

  }
  // Régions
  regions(): Observable<BolRegionModel[]> {
    return this.http.get<BolRegionModel[]>('/api/bol/region');
  }
  region(id: number): Observable<BolRegionModel> {
    return this.http.get<BolRegionModel>('/api/bol/region/'+id,);
  }

  // Traits
  avantages(): Observable<BolAvantageModel[]> {
    return this.http.get<BolAvantageModel[]>('/api/bol/trait/avantages');
  }
  desavantages(): Observable<BolDesavantageModel[]> {
    return this.http.get<BolDesavantageModel[]>('/api/bol/trait/desavantages');
  }

  updateTraits(hero: BolHerosModel): Observable<any> {
    return  this.http.post<BolHerosModel>('/api/bol/heros/traits/update', <BolHerosModel>hero);
  }

  // Héros
  createHeros(hero: BolHerosModel): Observable<any> {
    return this.http.post<BolHerosModel>('/api/bol/heros/create', <BolHerosModel>hero);
  }
  updateHeros(hero: BolHerosModel): Observable<any> {
    return this.http.post<BolHerosModel>('/api/bol/heros/update', <BolHerosModel>hero);
  }
  heroes(): Observable<BolHerosModel[]> {
    return this.http.get<BolHerosModel[]>('/api/bol/heros',);
  }
  heros(id: string): Observable<BolHerosModel>  {
    return this.http.get<BolHerosModel>('/api/bol/heros/'+id,);
  }
  deleteHeros(id: string): Observable<any> {
    return this.http.delete<BolHerosModel>('/api/bol/heros/delete/' + id);
  }
}
