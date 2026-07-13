import {Injectable, signal} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {BolApiMessage, BolApiSuccess} from "../models/bol-api.model";
import {BolHerosModel, BolHerosOrigines} from "../models/bol-heros.model";
import {BolRegionModel} from "../models/bol-region.model";
import {BolAvantageModel} from "../models/bol-avantage.model";
import {BolDesavantageModel} from "../models/bol-desavantage.model";
import {BolCarriereModel, BolHerosCarriereModel} from "../models/bol-carriere.model";
import {BolArmureModel, BolHerosArmureModel} from "../models/bol-armure.model";
import {BolArmeModel, BolHerosArmeModel} from "../models/bol-arme.model";
import {BolHerosTraitsModel} from "../models/bol-trait.model";
import {BolHerosLangueModel, BolLangueModel} from "../models/bol-langue.model";
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BolHerosService {

  constructor(private http: HttpClient) {

  }


  // Régions
  regions(): Observable<BolRegionModel[]> {
    return this.http.get<BolRegionModel[]>(`${environment.apiBase}/api/bol/region`);
  }

  region(id: number): Observable<BolRegionModel> {
    return this.http.get<BolRegionModel>(`${environment.apiBase}/api/bol/region/` + id);
  }

  // Traits
  avantages(): Observable<BolAvantageModel[]> {
    return this.http.get<BolAvantageModel[]>(`${environment.apiBase}/api/bol/trait/avantages`);
  }

  desavantages(): Observable<BolDesavantageModel[]> {
    return this.http.get<BolDesavantageModel[]>(`${environment.apiBase}/api/bol/trait/desavantages`);
  }

  createTrait(herosId: string | null | undefined, trait: BolHerosTraitsModel): Observable<BolHerosTraitsModel> {
    return this.http.post<BolHerosTraitsModel>(`${environment.apiBase}/api/bol/heros/traits/create/${herosId}`, trait);
  }

  deleteTrait(herosId: string | null | undefined, id: number): Observable<BolApiSuccess> {
    return this.http.delete<BolApiSuccess>(`${environment.apiBase}/api/bol/heros/traits/delete/${herosId}/${id}`);
  }


  // Carrieres

  carrieres(): Observable<BolCarriereModel[]> {
    return this.http.get<BolCarriereModel[]>(`${environment.apiBase}/api/bol/carrieres`);
  }

  deleteCarriere(herosId: string | null, id: number): Observable<BolApiSuccess> {
    return this.http.delete<BolApiSuccess>(`${environment.apiBase}/api/bol/heros/carrieres/delete/${herosId}/${id}`);
  }

  createCarriere(herosId: string | null, carriere: BolHerosCarriereModel): Observable<BolApiSuccess<BolHerosCarriereModel>> {
    return this.http.post<BolApiSuccess<BolHerosCarriereModel>>(`${environment.apiBase}/api/bol/heros/carrieres/create/${herosId}`, carriere);
  }

  // Armures
  armures(): Observable<BolArmureModel[]> {
    return this.http.get<BolArmureModel[]>(`${environment.apiBase}/api/bol/armures`);
  }

  createArmureCatalog(armure: BolArmureModel): Observable<BolArmureModel> {
    return this.http.post<BolArmureModel>(`${environment.apiBase}/api/bol/armures/create`, armure);
  }

  updateArmureCatalog(armure: BolArmureModel): Observable<BolArmureModel> {
    return this.http.post<BolArmureModel>(`${environment.apiBase}/api/bol/armures/update`, armure);
  }

  deleteArmureCatalog(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${environment.apiBase}/api/bol/armures/delete/${id}`);
  }

  createArmure(herosId: string | null | undefined, armure: BolHerosArmureModel): Observable<BolApiSuccess<BolHerosArmureModel>> {
    return this.http.post<BolApiSuccess<BolHerosArmureModel>>(`${environment.apiBase}/api/bol/heros/armures/create/${herosId}`, armure);
  }

  deleteArmure(herosId: string | null | undefined, id: number): Observable<BolApiSuccess> {
    return this.http.delete<BolApiSuccess>(`${environment.apiBase}/api/bol/heros/armures/delete/${herosId}/${id}`);
  }

  // Armes
  armes(): Observable<BolArmeModel[]> {
    return this.http.get<BolArmeModel[]>(`${environment.apiBase}/api/bol/armes`);
  }

  createArmeCatalog(arme: BolArmeModel): Observable<BolArmeModel> {
    return this.http.post<BolArmeModel>(`${environment.apiBase}/api/bol/armes/create`, arme);
  }

  updateArmeCatalog(arme: BolArmeModel): Observable<BolArmeModel> {
    return this.http.post<BolArmeModel>(`${environment.apiBase}/api/bol/armes/update`, arme);
  }

  deleteArmeCatalog(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${environment.apiBase}/api/bol/armes/delete/${id}`);
  }

  createArme(herosId: string | null | undefined, arme: BolHerosArmeModel): Observable<BolApiSuccess<BolHerosArmeModel>> {
    return this.http.post<BolApiSuccess<BolHerosArmeModel>>(`${environment.apiBase}/api/bol/heros/armes/create/${herosId}`, arme);
  }

  deleteArme(herosId: string | null | undefined, id: number): Observable<BolApiSuccess> {
    return this.http.delete<BolApiSuccess>(`${environment.apiBase}/api/bol/heros/armes/delete/${herosId}/${id}`);
  }

  // Langues
  langues(): Observable<BolLangueModel[]> {
    return this.http.get<BolLangueModel[]>(`${environment.apiBase}/api/bol/langues`);
  }

  createLangue(herosId: string | null | undefined, langue: BolHerosLangueModel): Observable<BolApiSuccess<BolHerosLangueModel>> {
    return this.http.post<BolApiSuccess<BolHerosLangueModel>>(`${environment.apiBase}/api/bol/heros/langues/create/${herosId}`, langue);
  }

  deleteLangue(herosId: string | null | undefined, id: number): Observable<BolApiSuccess> {
    return this.http.delete<BolApiSuccess>(`${environment.apiBase}/api/bol/heros/langues/delete/${herosId}/${id}`);
  }

  // Héros
  createHeros(hero: Record<string, unknown> | BolHerosModel): Observable<BolHerosModel> {
    return this.http.post<BolHerosModel>(`${environment.apiBase}/api/bol/heros/create`, hero);
  }

  updateHeros(hero: Record<string, unknown> | BolHerosModel): Observable<BolHerosModel> {
    return this.http.post<BolHerosModel>(`${environment.apiBase}/api/bol/heros/update`, hero);
  }

  createHerosAdvanced(hero: Record<string, unknown> | BolHerosModel): Observable<BolHerosModel> {
    return this.http.post<BolHerosModel>(`${environment.apiBase}/api/bol/heros/create/advanced`, hero);
  }

  updateHerosAdvanced(hero: Record<string, unknown> | BolHerosModel): Observable<BolHerosModel> {
    return this.http.post<BolHerosModel>(`${environment.apiBase}/api/bol/heros/update/advanced`, hero);
  }

  private readonly _heroesList = signal<BolHerosModel[]>([]);
  readonly heroesList = this._heroesList.asReadonly();

  loadHeroes(): void {
    this.http.get<BolHerosModel[]>(`${environment.apiBase}/api/bol/heros`).subscribe(
      (data) => this._heroesList.set(data),
    );
  }

  heroes(): Observable<BolHerosModel[]> {
    return this.http.get<BolHerosModel[]>(`${environment.apiBase}/api/bol/heros`);
  }

  heros(id: string): Observable<BolHerosModel> {
    return this.http.get<BolHerosModel>(`${environment.apiBase}/api/bol/heros/` + id);
  }

  deleteHeros(id: string): Observable<BolApiMessage> {
    return this.http.delete<BolApiMessage>(`${environment.apiBase}/api/bol/heros/delete/` + id);
  }

  // Origines
  updateOriginesHeros(herosId: string, origines: BolHerosOrigines): Observable<BolHerosModel> {
    return this.http.post<BolHerosModel>(`${environment.apiBase}/api/bol/heros/origines/update/` + herosId, origines);
  }

  // Pnj

  pnjs(): Observable<BolHerosModel[]> {
    return this.http.get<BolHerosModel[]>(`${environment.apiBase}/api/bol/pnj`);
  }
  pnj(id: string): Observable<BolHerosModel> {
    return this.http.get<BolHerosModel>(`${environment.apiBase}/api/bol/pnj/` + id);
  }

  quickCreate(pnj: Record<string, unknown>): Observable<BolHerosModel> {
    return this.http.post<BolHerosModel>(`${environment.apiBase}/api/bol/pnj/create`, pnj);
  }

  quickUpdate(pnj: Record<string, unknown>): Observable<BolHerosModel> {
    return this.http.post<BolHerosModel>(`${environment.apiBase}/api/bol/pnj/update`, pnj);
  }

  quickDelete(id: string): Observable<BolApiMessage> {
    return this.http.delete<BolApiMessage>(`${environment.apiBase}/api/bol/pnj/delete/` + id);
  }
}
