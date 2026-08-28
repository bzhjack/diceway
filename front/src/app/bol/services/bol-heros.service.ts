import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {apiUrl} from '../../core/api-url';
import {BolApiMessage, BolApiSuccess} from '../models/bol-api.model';
import {BolHerosModel, BolHerosOrigines} from '../models/bol-heros.model';
import {BolHerosCarriereModel} from '../models/bol-carriere.model';
import {BolHerosArmureModel} from '../models/bol-armure.model';
import {BolHerosArmeModel} from '../models/bol-arme.model';
import {BolHerosTraitsModel} from '../models/bol-trait.model';
import {BolHerosLangueModel} from '../models/bol-langue.model';

/** Héros : CRUD, création avancée et sous-ressources rattachées à un héros. */
@Injectable({
  providedIn: 'root',
})
export class BolHerosService {
  private readonly http = inject(HttpClient);

  // Héros
  heroes(): Observable<BolHerosModel[]> {
    return this.http.get<BolHerosModel[]>(apiUrl('bol/heros'));
  }

  heros(id: string): Observable<BolHerosModel> {
    return this.http.get<BolHerosModel>(apiUrl(`bol/heros/${id}`));
  }

  createHeros(hero: Record<string, unknown> | BolHerosModel): Observable<BolHerosModel> {
    return this.http.post<BolHerosModel>(apiUrl('bol/heros/create'), hero);
  }

  updateHeros(hero: Record<string, unknown> | BolHerosModel): Observable<BolHerosModel> {
    return this.http.post<BolHerosModel>(apiUrl('bol/heros/update'), hero);
  }

  createHerosAdvanced(hero: Record<string, unknown> | BolHerosModel): Observable<BolHerosModel> {
    return this.http.post<BolHerosModel>(apiUrl('bol/heros/create/advanced'), hero);
  }

  updateHerosAdvanced(hero: Record<string, unknown> | BolHerosModel): Observable<BolHerosModel> {
    return this.http.post<BolHerosModel>(apiUrl('bol/heros/update/advanced'), hero);
  }

  deleteHeros(id: string): Observable<BolApiMessage> {
    return this.http.delete<BolApiMessage>(apiUrl(`bol/heros/delete/${id}`));
  }

  updateOriginesHeros(herosId: string, origines: BolHerosOrigines): Observable<BolHerosModel> {
    return this.http.post<BolHerosModel>(apiUrl(`bol/heros/origines/update/${herosId}`), origines);
  }

  // Traits du héros
  createTrait(herosId: string | null | undefined, trait: BolHerosTraitsModel): Observable<BolHerosTraitsModel> {
    return this.http.post<BolHerosTraitsModel>(apiUrl(`bol/heros/traits/create/${herosId}`), trait);
  }

  deleteTrait(herosId: string | null | undefined, id: number): Observable<BolApiSuccess> {
    return this.http.delete<BolApiSuccess>(apiUrl(`bol/heros/traits/delete/${herosId}/${id}`));
  }

  // Carrières du héros
  createCarriere(herosId: string | null, carriere: BolHerosCarriereModel): Observable<BolApiSuccess<BolHerosCarriereModel>> {
    return this.http.post<BolApiSuccess<BolHerosCarriereModel>>(apiUrl(`bol/heros/carrieres/create/${herosId}`), carriere);
  }

  deleteCarriere(herosId: string | null, id: number): Observable<BolApiSuccess> {
    return this.http.delete<BolApiSuccess>(apiUrl(`bol/heros/carrieres/delete/${herosId}/${id}`));
  }

  // Armes du héros
  createArme(herosId: string | null | undefined, arme: BolHerosArmeModel): Observable<BolApiSuccess<BolHerosArmeModel>> {
    return this.http.post<BolApiSuccess<BolHerosArmeModel>>(apiUrl(`bol/heros/armes/create/${herosId}`), arme);
  }

  deleteArme(herosId: string | null | undefined, id: number): Observable<BolApiSuccess> {
    return this.http.delete<BolApiSuccess>(apiUrl(`bol/heros/armes/delete/${herosId}/${id}`));
  }

  // Armures du héros
  createArmure(herosId: string | null | undefined, armure: BolHerosArmureModel): Observable<BolApiSuccess<BolHerosArmureModel>> {
    return this.http.post<BolApiSuccess<BolHerosArmureModel>>(apiUrl(`bol/heros/armures/create/${herosId}`), armure);
  }

  deleteArmure(herosId: string | null | undefined, id: number): Observable<BolApiSuccess> {
    return this.http.delete<BolApiSuccess>(apiUrl(`bol/heros/armures/delete/${herosId}/${id}`));
  }

  // Langues du héros
  createLangue(herosId: string | null | undefined, langue: BolHerosLangueModel): Observable<BolApiSuccess<BolHerosLangueModel>> {
    return this.http.post<BolApiSuccess<BolHerosLangueModel>>(apiUrl(`bol/heros/langues/create/${herosId}`), langue);
  }

  deleteLangue(herosId: string | null | undefined, id: number): Observable<BolApiSuccess> {
    return this.http.delete<BolApiSuccess>(apiUrl(`bol/heros/langues/delete/${herosId}/${id}`));
  }

  adjustHeroisme(id: string, delta: number): Observable<BolHerosModel> {
    return this.http.patch<BolHerosModel>(apiUrl(`bol/heros/${id}/heroisme`), {delta});
  }
}
