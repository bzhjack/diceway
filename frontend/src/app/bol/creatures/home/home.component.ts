import {Component, inject} from '@angular/core';
import {RouterLink} from "@angular/router";
import {BolCreaturesService} from "../../services/bol-creatures.service";
import {NgxSpinnerService} from "ngx-spinner";
import {Subscription} from "rxjs";
import {BolCreatureModel} from "../../models/bol-creature.model";
import {CardModule} from "primeng/card";
import {NgForOf} from "@angular/common";
import {BolCreatureCardComponent} from "../card/card.component";
import {HeaderComponent} from "../../../shared/header/header.component";
import {ButtonDirective} from "primeng/button";

@Component({
  selector: 'bol-creature-home',
  standalone: true,
  imports: [
    RouterLink,
    CardModule,
    NgForOf,
    BolCreatureCardComponent,
    HeaderComponent,
    ButtonDirective
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class BolCreatureHomeComponent {
  private creatureService = inject(BolCreaturesService);
  private spinner = inject(NgxSpinnerService);
  private subsBestiary?: Subscription;
  public bestiary: Array<BolCreatureModel> = [];

  constructor() {
    this.getBestiary();
  }

  getBestiary() {
    this.spinner.show();
    this.subsBestiary?.unsubscribe();

    // Supposons que `hs.heroes()` et `hs.anotherRequest()` sont les deux requêtes HTTP que vous souhaitez lancer en parallèle
    const creaturesRequest = this.creatureService.creatures();

    this.subsBestiary = creaturesRequest.subscribe({
      next: (bestiary) => {
        this.bestiary = bestiary;
        this.spinner.hide();
      },
      error: () => {
        this.spinner.hide();
      }
    });
  }
}
