import {Component, effect, inject, OnDestroy} from '@angular/core';
import {CardModule} from "primeng/card";
import {Button} from "primeng/button";
import {NgIf} from "@angular/common";
import {RouterLink} from "@angular/router";
import {Subscription} from "rxjs";
import {BolHerosModel} from "../models/bol-heros.model";
import {BolDashboardService} from "../services/bol-dashboard.service";

@Component({
  selector: 'bol-home',
  standalone: true,
  imports: [
    CardModule,
    Button,
    NgIf,
    RouterLink
  ],
  providers: [BolDashboardService],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class BolHomeComponent implements OnDestroy {
  private dashboardService = inject(BolDashboardService);
  public pnj: Array<BolHerosModel> = [];
  public counts = this.dashboardService.dashboardCounts;

  private subs?: Subscription;

  constructor() {
    effect(() => {
      if (this.dashboardService.dashboardCounts()) {
        console.log('ici');
      }
    });
  }


  ngOnDestroy() {
    this.subs?.unsubscribe();
  }
}
