import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {BolHeroModel} from "../models/bol-hero.model";

@Injectable({
  providedIn: 'root'
})
export class BolHeroService {

  constructor(private http: HttpClient) {

  }
  create(hero: BolHeroModel): Observable<any> {
    return this.http.post<BolHeroModel>('/api/bol/hero/create', <BolHeroModel>hero);
  }
  update(hero: BolHeroModel): Observable<any> {
    return this.http.post<BolHeroModel>('/api/bol/hero/update', <BolHeroModel>hero);
  }
  all() {
    return this.http.get<Array<BolHeroModel>>('/api/bol/hero',);
  }
  one(id: string) {
    return this.http.get<BolHeroModel>('/api/bol/hero/'+id,);
  }
}
