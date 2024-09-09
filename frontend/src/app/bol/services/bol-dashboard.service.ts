import {computed, effect, inject, Injectable, signal} from '@angular/core';
import {BolHerosService} from "./bol-heros.service";
import {toSignal} from "@angular/core/rxjs-interop";
import {BolHerosModel} from "../models/bol-heros.model";
import {BolCreaturesService} from "./bol-creatures.service";
import {Observable} from "rxjs";
import {BolCreatureModel} from "../models/bol-creature.model";
import {HttpClient} from "@angular/common/http";
import {BolDashboardModel} from "../models/bol-dashboard.model";
import {NgxSpinnerService} from "ngx-spinner";
import {tap} from "rxjs/operators";

@Injectable()
export class BolDashboardService {
  private spinner = inject(NgxSpinnerService);

  constructor(private http: HttpClient) {
  }

  getCounts(): Observable<BolDashboardModel> {
    this.spinner.show('bol-dashboard');
    return this.http.get<BolDashboardModel>('/api/bol/dashboard/count').pipe(tap(() => this.spinner.hide('bol-dashboard')));
  }

  dashboardCounts = toSignal(this.getCounts());
}
