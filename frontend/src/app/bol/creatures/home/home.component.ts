import {Component, inject, OnDestroy} from '@angular/core';
import {RouterLink} from "@angular/router";
import {BolCreaturesService} from "../../services/bol-creatures.service";
import {NgxSpinnerService} from "ngx-spinner";
import {Subscription} from "rxjs";
import {BolCreatureModel} from "../../models/bol-creature.model";
import {CardModule} from "primeng/card";
import {NgForOf, NgIf} from "@angular/common";
import {BolCreatureCardComponent} from "../card/card.component";
import {HeaderComponent} from "../../../shared/header/header.component";
import {Button, ButtonDirective} from "primeng/button";
import {DialogModule} from "primeng/dialog";
import {AvatarModule} from "primeng/avatar";
import {BolCreatureCreateComponent} from "../create/create.component";
import {DialogService, DynamicDialogRef} from "primeng/dynamicdialog";
import {BolHerosModel} from "../../models/bol-heros.model";
import {ConfirmationService} from "primeng/api";
import {ConfirmPopupModule} from "primeng/confirmpopup";
import {InputTextModule} from "primeng/inputtext";
import {FormsModule} from "@angular/forms";
import {RadioButtonModule} from "primeng/radiobutton";
import {DropdownModule} from "primeng/dropdown";
import {TableModule} from "primeng/table";

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
    BolCreatureCreateComponent,
    ConfirmPopupModule,
    InputTextModule,
    FormsModule,
    RadioButtonModule,
    DropdownModule,
    TableModule,
    NgIf
  ],
  providers: [
    ConfirmationService
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class BolCreatureHomeComponent implements OnDestroy {
  private creatureService = inject(BolCreaturesService);
  private spinner = inject(NgxSpinnerService);
  private subsBestiary?: Subscription;
  public bestiary: Array<BolCreatureModel> = [];
  public filteredBestiary: BolCreatureModel[] = [];
  readonly #ds = inject(DialogService);
  private subs: Subscription | undefined;
  private ref?: DynamicDialogRef;
  searchTerm: string = '';
  type: 'ALL' | 'PRIVATE' | 'PUBLIC' = 'ALL'
  typeOptions: any[] = [
    { label: 'Tous', value: 'ALL' },
    { label: 'Public', value: 'PUBLIC' },
    { label: 'Privé', value: 'PRIVATE' }
  ];

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
        this.filteredBestiary = bestiary;
        this.spinner.hide();
      },
      error: () => {
        this.spinner.hide();
      }
    });
  }

  filterCreatures() {
    const term = this.searchTerm.toLowerCase();
    const type = this.type;

    this.filteredBestiary = this.bestiary.filter(creature => {
      const matchesName = creature.nom.toLowerCase().includes(term); // Remplace `nom` par la propriété appropriée
      const matchesType = this.getTypeFilter(creature, type);

      return matchesName && matchesType;
    });
  }

  getTypeFilter(creature: any, type: 'ALL' | 'PRIVATE' | 'PUBLIC'): boolean {
    switch (type) {
      case 'PUBLIC':
        return creature.user_id === null;
      case 'PRIVATE':
        return creature.user_id !== null;
      case 'ALL':
        return true;
      default:
        return true;
    }
  }

  createCreature(creature?: BolCreatureModel) {
    this.ref = this.#ds.open(BolCreatureCreateComponent, {
      header: creature ? 'Modification d\'une créature' : 'Création d\'une créature',
      data: {
        creature: creature
      }
    });
    this.subs?.unsubscribe();
    this.subs = this.ref.onClose.subscribe((creature: BolCreatureModel) => {
      if (creature) {
        this.spinner.show();
        this.subs?.unsubscribe();
        const actionService = creature.id ? this.creatureService.updateCreature(creature) : this.creatureService.createCreature(creature);
        this.subs = actionService.subscribe({
          next: () => {
            this.spinner.hide();
            this.getBestiary();
          },
          error: () => {
            this.spinner.hide();
          }
        });
      }
    });
  }

  deleteCreature(creature: BolCreatureModel, event: any) {
    this.spinner.show();
    this.subs?.unsubscribe();
    this.subs = this.creatureService.deleteCreature(creature.id as string).subscribe({
      next: () => {
        this.spinner.hide();
        this.getBestiary();
      },
      error: () => {
        this.spinner.hide();
      }
    });

  }

  ngOnDestroy() {
    this.subs?.unsubscribe();
    if (this.ref) {
      this.ref.close();
    }
  }
}
