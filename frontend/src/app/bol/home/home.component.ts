import {Component, inject, OnDestroy} from '@angular/core';
import {CardModule} from "primeng/card";
import {Button} from "primeng/button";
import {NgIf} from "@angular/common";
import {RouterLink} from "@angular/router";
import {NgxSpinnerService} from "ngx-spinner";
import {forkJoin, Subscription} from "rxjs";
import {BolCreaturesService} from "../services/bol-creatures.service";
import {BolHerosService} from "../services/bol-heros.service";
import {BolHerosModel} from "../models/bol-heros.model";
import {BolCreatureModel} from "../models/bol-creature.model";

@Component({
  selector: 'bol-home',
  standalone: true,
  imports: [
    CardModule,
    Button,
    NgIf,
    RouterLink
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class BolHomeComponent implements OnDestroy {
  private spinner = inject(NgxSpinnerService);
  private creatureService = inject(BolCreaturesService);
  private herosService = inject(BolHerosService);

  public pnj: Array<BolHerosModel> = [];
  public heroes: Array<BolHerosModel> = [];
  public creatures: Array<BolCreatureModel> = [];

  private subs?: Subscription;
  constructor() {
    this.getLore();
  }

  getLore() {
    this.spinner.show();
    this.subs?.unsubscribe();

    // Supposons que `hs.heroes()` et `hs.anotherRequest()` sont les deux requêtes HTTP que vous souhaitez lancer en parallèle
    const heroesRequest = this.herosService.heroes();
    const creaturesRequest = this.creatureService.creatures();
    const pnjRequest = this.herosService.pnj();

    this.subs = forkJoin([heroesRequest, creaturesRequest, pnjRequest]).subscribe({
      next: ([heroes, creatures, pnj]) => {
        this.heroes = heroes;
        this.creatures = creatures;
        this.pnj = pnj;
        this.spinner.hide();
      },
      error: (error) => {
        this.spinner.hide();
        // Gérer les erreurs ici
      }
    });
  }
  ngOnDestroy() {
    this.subs?.unsubscribe();
  }
}
