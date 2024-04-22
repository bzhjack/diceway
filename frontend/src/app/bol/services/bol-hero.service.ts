import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {BolHeroModel} from "../models/bol-hero.model";

@Injectable({
  providedIn: 'root'
})
export class BolHeroService {

  constructor(private http: HttpClient) {
  }
  create(hero: BolHeroModel): Observable<BolHeroModel> {
    return this.http.post<BolHeroModel>('/api/bol/hero/create', <BolHeroModel>hero);
  }
}
