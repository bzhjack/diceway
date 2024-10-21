import {Injectable} from '@angular/core';
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {BolQuestModel} from "../models/bol-quest.model";
import {BolHerosModel} from "../models/bol-heros.model";

@Injectable({
  providedIn: 'root'
})
export class BolQuestService {
  constructor(private http: HttpClient) { }
  quests(): Observable<BolQuestModel[]> {
    return this.http.get<BolQuestModel[]>('/api/bol/quest');
  }

  quest(idQuest: string): Observable<BolQuestModel> {
    return this.http.get<BolQuestModel>('/api/bol/quest/' + idQuest);
  }
  createQuest(quest: BolQuestModel): Observable<any> {
    return this.http.post<BolQuestModel>('/api/bol/quest/create', <BolQuestModel>quest);
  }
  updateQuest(quest: BolQuestModel): Observable<any> {
    return this.http.post<BolQuestModel>('/api/bol/quest/update', <BolQuestModel>quest);
  }
  addProtagonistToQuest(hero: BolHerosModel, questId: string, type: 'H' | 'P' | 'C' | 'D'): Observable<any> {
    const protagonist = {
      protagonist_id : hero.id,
      quest_id: questId,
      type: type,
      vitalite: hero.ressources.vitalite,
      heroisme: hero.ressources.heroisme,
      creation: hero.ressources.creation,
      vilenie: hero.ressources.vilenie,
      foi: hero.ressources.foi
    }
    return this.http.post('/api/bol/quest/add/protagonist', protagonist);
  }
}
