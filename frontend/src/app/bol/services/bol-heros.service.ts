import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {BolHerosModel, BolHerosOrigines} from "../models/bol-heros.model";
import {BolRegionModel} from "../models/bol-region.model";
import {BolAvantageModel} from "../models/bol-avantage.model";
import {BolDesavantageModel} from "../models/bol-desavantage.model";
import {BolHerosCarriereModel} from "../models/bol-carriere.model";
import {BolArmureModel, BolHerosArmureModel} from "../models/bol-armure.model";
import {BolArmeModel, BolHerosArmeModel} from "../models/bol-arme.model";
import {BolHerosTraitsModel} from "../models/bol-trait.model";
import {BolHerosLangueModel, BolLangueModel} from "../models/bol-langue.model";

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
    return this.http.get<BolRegionModel>('/api/bol/region/' + id,);
  }

  // Traits
  avantages(): Observable<BolAvantageModel[]> {
    return this.http.get<BolAvantageModel[]>('/api/bol/trait/avantages');
  }

  desavantages(): Observable<BolDesavantageModel[]> {
    return this.http.get<BolDesavantageModel[]>('/api/bol/trait/desavantages');
  }

  createTrait(herosId: string | null | undefined, trait: BolHerosTraitsModel): Observable<any> {
    return this.http.post<BolHerosTraitsModel>(`/api/bol/heros/traits/create/${herosId}`, <BolHerosTraitsModel>trait);
  }

  deleteTrait(herosId: string | null | undefined, id: number): Observable<any> {
    return this.http.delete<BolHerosTraitsModel>(`/api/bol/heros/traits/delete/${herosId}/${id}`);
  }


  // Carrieres

  carrieres(): Observable<any> {
    return this.http.get<BolHerosCarriereModel[]>('/api/bol/carrieres');
  }

  deleteCarriere(herosId: string | null, id: number): Observable<any> {
    return this.http.delete<boolean>(`/api/bol/heros/carrieres/delete/${herosId}/${id}`);
  }

  createCarriere(herosId: string | null, carriere: BolHerosCarriereModel): Observable<any> {
    return this.http.post<BolHerosModel>(`/api/bol/heros/carrieres/create/${herosId}`, <BolHerosCarriereModel>carriere);
  }

  // Armures
  armures(): Observable<any> {
    return this.http.get<BolArmureModel[]>('/api/bol/armures');
  }

  createArmure(herosId: string | null | undefined, armure: BolHerosArmureModel): Observable<any> {
    return this.http.post<BolHerosArmureModel>(`/api/bol/heros/armures/create/${herosId}`, <BolHerosArmureModel>armure);
  }

  deleteArmure(herosId: string | null | undefined, id: number): Observable<any> {
    return this.http.delete<boolean>(`/api/bol/heros/armures/delete/${herosId}/${id}`);
  }

  // Armes
  armes(): Observable<any> {
    return this.http.get<BolArmeModel[]>('/api/bol/armes');
  }

  createArme(herosId: string | null | undefined, arme: BolHerosArmeModel): Observable<any> {
    return this.http.post<BolHerosModel>(`/api/bol/heros/armes/create/${herosId}`, <BolHerosArmeModel>arme);
  }

  deleteArme(herosId: string | null | undefined, id: number): Observable<any> {
    return this.http.delete<boolean>(`/api/bol/heros/armes/delete/${herosId}/${id}`);
  }

  // Langues
  langues(): Observable<any> {
    return this.http.get<BolLangueModel[]>('/api/bol/langues');
  }

  createLangue(herosId: string | null | undefined, langue: BolHerosLangueModel): Observable<any> {
    return this.http.post<BolHerosModel>(`/api/bol/heros/langues/create/${herosId}`, <BolHerosLangueModel>langue);
  }

  deleteLangue(herosId: string | null | undefined, id: number): Observable<any> {
    return this.http.delete<boolean>(`/api/bol/heros/langues/delete/${herosId}/${id}`);
  }

  // Héros
  createHeros(hero: BolHerosModel): Observable<any> {
    return this.http.post<BolHerosModel>('/api/bol/heros/create', <BolHerosModel>hero);
  }

  updateHeros(hero: BolHerosModel): Observable<any> {
    return this.http.post<BolHerosModel>('/api/bol/heros/update', <BolHerosModel>hero);
  }

  heroes(): Observable<BolHerosModel[]> {
    return this.http.get<BolHerosModel[]>('/api/bol/heros');
  }

  heros(id: string): Observable<BolHerosModel> {
    return this.http.get<BolHerosModel>('/api/bol/heros/' + id);
  }

  deleteHeros(id: string): Observable<any> {
    return this.http.delete<BolHerosModel>('/api/bol/heros/delete/' + id);
  }

  // Origines
  updateOriginesHeros(herosId: string, origines: BolHerosOrigines): Observable<any> {
    return this.http.post<BolHerosModel>('/api/bol/heros/origines/update/' + herosId, origines);
  }

  // Pnj

  pnjs(): Observable<BolHerosModel[]> {
    return this.http.get<BolHerosModel[]>('/api/bol/pnj');
  }
  pnj(id: string): Observable<BolHerosModel> {
    return this.http.get<BolHerosModel>('/api/bol/pnj/' + id);
  }

  quickCreate(pnj: BolHerosModel): Observable<any> {
    return this.http.post<BolHerosModel>('/api/bol/pnj/create', <BolHerosModel>pnj);
  }

  quickUpdate(pnj: BolHerosModel): Observable<any> {
    return this.http.post<BolHerosModel>('/api/bol/pnj/update', <BolHerosModel>pnj);
  }

  quickDelete(id: string): Observable<any> {
    return this.http.delete<BolHerosModel>('/api/bol/pnj/delete/' + id);
  }
}
