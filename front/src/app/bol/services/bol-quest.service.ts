import {Injectable} from '@angular/core';
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {BolQuestModel, BolQuestProtagonistModel} from "../models/bol-quest.model";
import {BolHerosModel} from "../models/bol-heros.model";
import {BolCreatureModel} from "../models/bol-creature.model";
import {BolDemonModel} from "../models/bol-demon.model";
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BolQuestService {
  constructor(private http: HttpClient) {
  }


  quests(): Observable<BolQuestModel[]> {
    return this.http.get<BolQuestModel[]>(`${environment.apiBase}/api/bol/quest`);
  }

  quest(idQuest: string): Observable<BolQuestModel> {
    return this.http.get<BolQuestModel>(`${environment.apiBase}/api/bol/quest/` + idQuest);
  }

  createQuest(quest: BolQuestModel): Observable<any> {
    return this.http.post<BolQuestModel>(`${environment.apiBase}/api/bol/quest/create`, <BolQuestModel>quest);
  }

  updateQuest(quest: BolQuestModel): Observable<any> {
    return this.http.post<BolQuestModel>(`${environment.apiBase}/api/bol/quest/update`, <BolQuestModel>quest);
  }

  questProtagonist(idProtagonist: number): Observable<BolQuestProtagonistModel> {
    return this.http.get<BolQuestProtagonistModel>(`${environment.apiBase}/api/bol/quest/protagonist/` + idProtagonist);
  }

  addProtagonistToQuest(character: BolHerosModel | BolCreatureModel | BolDemonModel, questId: string, type: 'H' | 'P' | 'C' | 'D'): Observable<any> {
    let protagonist: Partial<BolQuestProtagonistModel> = {};
    if (type === 'H' || type === 'P') {
      character = character as BolHerosModel;
      protagonist = {
        protagonist_id: character.id ?? '',
        quest_id: questId,
        type: type,
        vitalite: character.ressources.vitalite,
        heroisme: character.ressources.heroisme,
        creation: character.ressources.creation,
        vilenie: character.ressources.vilenie,
        foi: character.ressources.foi
      }
    }
    if (type === 'C') {
      const creature = character as BolCreatureModel;
      protagonist = {
        protagonist_id: creature.id ?? '',
        quest_id: questId,
        type: type,
        vitalite: creature.vitalite,
        heroisme: 0,
        creation: 0,
        vilenie: 0,
        foi: 0
      }
    }
    if (type === 'D') {
      const demon = character as BolDemonModel;
      protagonist = {
        protagonist_id: demon.id ?? '',
        quest_id: questId,
        type: type,
        vitalite: demon.vitalite,
        heroisme: 0,
        creation: 0,
        vilenie: 0,
        foi: 0
      }
    }
    return this.http.post(`${environment.apiBase}/api/bol/quest/protagonist/create`, protagonist);
  }

  updateProtagonistToQuest(id: number, ressources: any): Observable<any> {
    const protagonist = {
      id: id,
      vitalite: ressources.vitalite ?? 0,
      heroisme: ressources.heroisme ?? 0,
      vilenie: ressources.vilenie ?? 0,
      foi: ressources.foi ?? 0,
      creation: ressources.creation ?? 0,
    }
    return this.http.post(`${environment.apiBase}/api/bol/quest/protagonist/update`, protagonist);
  }

  deleteProtagonistToQuest(id: number): Observable<any> {
    return this.http.delete(`${environment.apiBase}/api/bol/quest/protagonist/` + id);
  }
}
