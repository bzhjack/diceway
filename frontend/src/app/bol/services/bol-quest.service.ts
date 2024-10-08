import {Injectable} from '@angular/core';
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {BolQuestModel} from "../models/bol-quest.model";

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
  addProtagonistToQuest(heroId: string, questId: string, type: 'H' | 'P' | 'C' | 'D'): Observable<any> {
    const protagonist = {
      protagonist_id : heroId,
      quest_id: questId,
      type: type
    }
    return this.http.post('/api/bol/quest/add/protagonist', protagonist);
  }
}
