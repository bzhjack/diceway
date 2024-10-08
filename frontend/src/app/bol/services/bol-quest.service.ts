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
  addHerosToQuest(data: {heroId: string, questId: string, type?: string}): Observable<any> {
    data.type = 'H';
    return this.http.post<{heroId: string, questId: string, type: string}>('/api/bol/quest/add/protagonist', <{heroId: string, questId: string, type: string}>data);
  }
}
