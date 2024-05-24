import {Injectable} from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {Observable} from "rxjs";
import {BolHerosModel} from "../models/bol-heros.model";
import {BolRegionModel} from "../models/bol-region.model";

@Injectable({
  providedIn: 'root'
})
export class BolHerosService {

  constructor(private http: HttpClient) {

  }
  allRegions(): Observable<BolRegionModel[]> {
    return this.http.get<BolRegionModel[]>('/api/bol/region');
  }
  create(hero: BolHerosModel): Observable<any> {
    return this.http.post<BolHerosModel>('/api/bol/heros/create', <BolHerosModel>hero);
  }
  update(hero: BolHerosModel): Observable<any> {
    return this.http.post<BolHerosModel>('/api/bol/heros/update', <BolHerosModel>hero);
  }
  heroes(): Observable<BolHerosModel[]> {
    return this.http.get<BolHerosModel[]>('/api/bol/heros',);
  }
  heros(id: string): Observable<BolHerosModel>  {
    return this.http.get<BolHerosModel>('/api/bol/heros/'+id,);
  }
}
