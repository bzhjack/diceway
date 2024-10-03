import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {BolHerosModel} from "../models/bol-heros.model";
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
  createQuest(quest: BolQuestModel): Observable<any> {
    return this.http.post<BolQuestModel>('/api/bol/quest/create', <BolQuestModel>quest);
  }

}
