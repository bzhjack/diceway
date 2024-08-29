import {Component, inject, OnDestroy} from '@angular/core';
import {RouterLink} from "@angular/router";
import {BolCreaturesService} from "../../services/bol-creatures.service";
import {NgxSpinnerService} from "ngx-spinner";
import {Subscription} from "rxjs";
import {BolCreatureModel} from "../../models/bol-creature.model";
import {CardModule} from "primeng/card";
import {NgForOf} from "@angular/common";
import {BolCreatureCardComponent} from "../card/card.component";
import {HeaderComponent} from "../../../shared/header/header.component";
import {Button, ButtonDirective} from "primeng/button";
import {DialogModule} from "primeng/dialog";
import {AvatarModule} from "primeng/avatar";
import {BolCreatureCreateComponent} from "../create/create.component";
import {DialogService} from "primeng/dynamicdialog";

@Component({
  selector: 'bol-creature-home',
  standalone: true,
  imports: [
    RouterLink,
    CardModule,
    NgForOf,
    BolCreatureCardComponent,
    HeaderComponent,
    ButtonDirective,
    Button,
    DialogModule,
    AvatarModule,
    BolCreatureCreateComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class BolCreatureHomeComponent implements OnDestroy {
  private creatureService = inject(BolCreaturesService);
  private spinner = inject(NgxSpinnerService);
  private subsBestiary?: Subscription;
  public bestiary: Array<BolCreatureModel> = [];
  readonly #ds = inject(DialogService);
  private subs: Subscription | undefined;

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
  createCreature() {
    const ref = this.#ds.open(BolCreatureCreateComponent, {
      header: 'Création d\'une créature'
    });
    this.subs?.unsubscribe();
    this.subs = ref.onClose.subscribe((avatar: any) => {
    });
  }


  ngOnDestroy() {
    this.subs?.unsubscribe();
  }
}
