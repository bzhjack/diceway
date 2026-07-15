import {inject, Injectable} from '@angular/core';
import {toSignal} from "@angular/core/rxjs-interop";
import {catchError, Observable, throwError} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {BolDashboardModel} from "../models/bol-dashboard.model";
import {tap} from "rxjs/operators";
import {apiUrl} from '../../core/api-url';

@Injectable()
export class BolDashboardService {
  private http = inject(HttpClient);

  getCounts(): Observable<BolDashboardModel> {
    return this.http.get<BolDashboardModel>(apiUrl('bol/dashboard/count')).pipe(
      tap(() => void 0),
      catchError((error) => throwError(() => error))
    );
  }

  dashboardCounts = toSignal(this.getCounts());
}
