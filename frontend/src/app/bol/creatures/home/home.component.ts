import {Component, inject, OnDestroy, ViewChild} from '@angular/core';
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
import {ConfirmationService} from "primeng/api";
import {ConfirmPopupModule} from "primeng/confirmpopup";
import {InputTextModule} from "primeng/inputtext";
import {FormsModule} from "@angular/forms";
import {RadioButtonModule} from "primeng/radiobutton";
import {DropdownModule} from "primeng/dropdown";
import {Table, TableModule} from "primeng/table";
import {TooltipModule} from "primeng/tooltip";
import {Ripple} from "primeng/ripple";
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'bol-creature-home',
  standalone: true,
  imports: [
    RouterLink,
    CardModule,
    CheckboxModule,
    NgForOf,
    BolCreatureCardComponent,
    HeaderComponent,
    ButtonDirective,
    Button,
    TagModule,
    DialogModule,
    AvatarModule,
    BolCreatureCreateComponent,
    ConfirmPopupModule,
    InputTextModule,
    FormsModule,
    RadioButtonModule,
    DropdownModule,
    TableModule,
    NgIf,
    TooltipModule,
    Ripple,
    InputIconModule,
    IconFieldModule
  ],
  providers: [
    ConfirmationService
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class BolCreatureHomeComponent implements OnDestroy {
  private confirmationService = inject(ConfirmationService);
  private creatureService = inject(BolCreaturesService);
  readonly #ds = inject(DialogService);
  private spinner = inject(NgxSpinnerService);
  private subsBestiary?: Subscription;
  public beast: Array<BolCreatureModel> = [];
  public filteredBeast: Array<BolCreatureModel> = [];
  private subs: Subscription | undefined;
  private ref?: DynamicDialogRef;
  public creation: boolean = false;

  @ViewChild('beastTable') beastTable?: Table;

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
        this.beast = bestiary;
        this.filteredBeast = bestiary;
        this.spinner.hide();
      },
      error: () => {
        this.spinner.hide();
      }
    });
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
  askDelete(creature: BolCreatureModel, event: any) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Voulez vous supprimer cette créature ?',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      acceptLabel: "Oui",
      rejectLabel: "Non",
      accept: () => {
        this.deleteCreature(creature);
      },
    });
  }
  deleteCreature(creature: BolCreatureModel) {
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

  filtering(ev: any) {
    this.beastTable?.filterGlobal(ev.target?.value, 'contains')
  }

  getSeverity (creature: BolCreatureModel) {
    switch (creature?.user_id) {
      case null:
        return 'success';
      default:
        return 'info';
    }
  };
  filterCreation(creation: boolean) {
    this.filteredBeast = creation ? this.beast.filter((beast) => beast.user_id !== null) : this.beast;
  }
}
