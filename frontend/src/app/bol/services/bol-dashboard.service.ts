import {computed, effect, inject, Injectable, signal} from '@angular/core';
import {BolHerosService} from "./bol-heros.service";
import {toSignal} from "@angular/core/rxjs-interop";
import {BolHerosModel} from "../models/bol-heros.model";
import {BolCreaturesService} from "./bol-creatures.service";
import {Observable} from "rxjs";
import {BolCreatureModel} from "../models/bol-creature.model";
import {HttpClient} from "@angular/common/http";
import {BolDashboardModel} from "../models/bol-dashboard.model";
@Injectable({
  providedIn: 'root'
})
export class BolDashboardService {
  constructor(private http: HttpClient) {
  }
  getCounts(): Observable<BolDashboardModel> {
    return this.http.get<BolDashboardModel>('/api/bol/dashboard/count');
  }
  dashboardCounts = toSignal(this.getCounts());

  }
