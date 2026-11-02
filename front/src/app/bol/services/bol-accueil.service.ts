import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {apiUrl} from '../../core/api-url';
import {BolAccueilModel} from '../models/bol-accueil.model';

@Injectable({providedIn: 'root'})
export class BolAccueilService {
  private readonly http = inject(HttpClient);
  private readonly base = apiUrl('bol/accueil');

  accueil(): Observable<BolAccueilModel> {
    return this.http.get<BolAccueilModel>(this.base);
  }
}
