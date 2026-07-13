import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {apiUrl} from '../../core/api-url';
import {BolArmeModel} from '../models/bol-arme.model';
import {BolArmureModel} from '../models/bol-armure.model';
import {BolAvantageModel} from '../models/bol-avantage.model';
import {BolCarriereModel} from '../models/bol-carriere.model';
import {BolDesavantageModel} from '../models/bol-desavantage.model';
import {BolLangueModel} from '../models/bol-langue.model';
import {BolRegionModel} from '../models/bol-region.model';

/** Référentiels BoL (régions, traits, carrières, langues) et catalogues d'équipement. */
@Injectable({
  providedIn: 'root',
})
export class BolCatalogService {
  private readonly http = inject(HttpClient);

  // Régions
  regions(): Observable<BolRegionModel[]> {
    return this.http.get<BolRegionModel[]>(apiUrl('bol/region'));
  }

  // Traits
  avantages(): Observable<BolAvantageModel[]> {
    return this.http.get<BolAvantageModel[]>(apiUrl('bol/trait/avantages'));
  }

  desavantages(): Observable<BolDesavantageModel[]> {
    return this.http.get<BolDesavantageModel[]>(apiUrl('bol/trait/desavantages'));
  }

  // Carrières
  carrieres(): Observable<BolCarriereModel[]> {
    return this.http.get<BolCarriereModel[]>(apiUrl('bol/carrieres'));
  }

  // Langues
  langues(): Observable<BolLangueModel[]> {
    return this.http.get<BolLangueModel[]>(apiUrl('bol/langues'));
  }

  // Catalogue des armes
  armes(): Observable<BolArmeModel[]> {
    return this.http.get<BolArmeModel[]>(apiUrl('bol/armes'));
  }

  createArme(arme: BolArmeModel): Observable<BolArmeModel> {
    return this.http.post<BolArmeModel>(apiUrl('bol/armes/create'), arme);
  }

  updateArme(arme: BolArmeModel): Observable<BolArmeModel> {
    return this.http.post<BolArmeModel>(apiUrl('bol/armes/update'), arme);
  }

  deleteArme(id: number): Observable<boolean> {
    return this.http.delete<boolean>(apiUrl(`bol/armes/delete/${id}`));
  }

  // Catalogue des armures
  armures(): Observable<BolArmureModel[]> {
    return this.http.get<BolArmureModel[]>(apiUrl('bol/armures'));
  }

  createArmure(armure: BolArmureModel): Observable<BolArmureModel> {
    return this.http.post<BolArmureModel>(apiUrl('bol/armures/create'), armure);
  }

  updateArmure(armure: BolArmureModel): Observable<BolArmureModel> {
    return this.http.post<BolArmureModel>(apiUrl('bol/armures/update'), armure);
  }

  deleteArmure(id: number): Observable<boolean> {
    return this.http.delete<boolean>(apiUrl(`bol/armures/delete/${id}`));
  }
}
