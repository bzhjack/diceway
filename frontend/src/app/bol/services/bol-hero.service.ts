import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {BolHeroModel} from "../models/bol-hero.model";
import {BolRegionModel} from "../models/bol-region.model";

@Injectable({
  providedIn: 'root'
})
export class BolHeroService {

  constructor(private http: HttpClient) {

  }
  allRegions(): Observable<BolRegionModel[]> {
    return this.http.get<BolRegionModel[]>('/api/bol/region');
  }
  create(hero: BolHeroModel): Observable<any> {
    return this.http.post<BolHeroModel>('/api/bol/hero/create', <BolHeroModel>hero);
  }
  update(hero: BolHeroModel): Observable<any> {
    return this.http.post<BolHeroModel>('/api/bol/hero/update', <BolHeroModel>hero);
  }
  all(): Observable<BolHeroModel[]> {
    return this.http.get<BolHeroModel[]>('/api/bol/hero',);
  }
  one(id: string): Observable<BolHeroModel>  {
    return this.http.get<BolHeroModel>('/api/bol/hero/'+id,);
  }
}
