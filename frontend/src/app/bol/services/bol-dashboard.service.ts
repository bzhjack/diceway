import {inject, Injectable} from '@angular/core';
import {toSignal} from "@angular/core/rxjs-interop";
import {catchError, Observable, throwError} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {BolDashboardModel} from "../models/bol-dashboard.model";
import {NgxSpinnerService} from "ngx-spinner";
import {tap} from "rxjs/operators";
import { environment } from '../../../environments/environment';

@Injectable()
export class BolDashboardService {
  private spinner = inject(NgxSpinnerService);

  constructor(private http: HttpClient) {
  }


  getCounts(): Observable<BolDashboardModel> {
    this.spinner.show('bol-dashboard');
    return this.http.get<BolDashboardModel>(`${environment.apiBase}/api/bol/dashboard/count`).pipe(
      tap(() => this.spinner.hide('bol-dashboard')),
      catchError((error) => {
        this.spinner.hide('bol-dashboard');
        return throwError(() => error);
      })
    );
  }

  dashboardCounts = toSignal(this.getCounts());
}
