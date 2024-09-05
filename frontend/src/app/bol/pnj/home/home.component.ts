import {Component, inject} from '@angular/core';
import {Button, ButtonDirective} from "primeng/button";
import {DropdownModule} from "primeng/dropdown";
import {FormsModule} from "@angular/forms";
import {HeaderComponent} from "../../../shared/header/header.component";
import {InputTextModule} from "primeng/inputtext";
import {RouterLink} from "@angular/router";
import {BolPnjCreateComponent} from "../create/create.component";
import {BolCreatureModel} from "../../models/bol-creature.model";
import {BolCreatureCreateComponent} from "../../creatures/create/create.component";
import {DialogService, DynamicDialogRef} from "primeng/dynamicdialog";
import {Subscription} from "rxjs";
import {NgxSpinnerService} from "ngx-spinner";
import {BolHerosModel} from "../../models/bol-heros.model";
import {BolCreaturesService} from "../../services/bol-creatures.service";
import {BolHerosService} from "../../services/bol-heros.service";
import {NgForOf} from "@angular/common";
import {BolCreatureCardComponent} from "../../creatures/card/card.component";
import {BolPnjCardComponent} from "../card/card.component";
import {ConfirmationService} from "primeng/api";
import {ConfirmPopupModule} from "primeng/confirmpopup";

@Component({
  selector: 'bol-pnj-home',
  standalone: true,
  imports: [
    ButtonDirective,
    DropdownModule,
    FormsModule,
    HeaderComponent,
    InputTextModule,
    RouterLink,
    BolPnjCreateComponent,
    NgForOf,
    Button,
    BolCreatureCardComponent,
    BolPnjCardComponent,
    ConfirmPopupModule
  ],
  providers: [
    ConfirmationService
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class BolPnjHomeComponent {
  private pnjService = inject(BolHerosService);
  private spinner = inject(NgxSpinnerService);
  readonly #ds = inject(DialogService);
  private subs: Subscription | undefined;
  private subsPnj: Subscription | undefined;
  private ref?: DynamicDialogRef;
  public pnjList: Array<BolHerosModel> = [];

  constructor() {
    this.getPnj();
  }

  getPnj() {
    this.spinner.show();
    this.subsPnj?.unsubscribe();
    this.pnjList = [];
    this.subsPnj = this.pnjService.pnj().subscribe({
      next: (pnj: BolHerosModel[]) => {
        this.pnjList = pnj;
        this.spinner.hide();
      },
      error: () => {
        this.spinner.hide();
      }
    });
  }

  createPnj(pnj?: BolHerosModel) {
    this.ref = this.#ds.open(BolPnjCreateComponent, {
      header: pnj ? 'Modification d\'un PNJ' : 'Création d\'un PNJ',
      data: {
        pnj: pnj
      }
    });
    this.subs?.unsubscribe();
    this.subs = this.ref.onClose.subscribe((pnj: BolHerosModel) => {
      if (pnj) {
        this.spinner.show();
        this.subs?.unsubscribe();
        pnj.joueur = 'master';
        const actionService = pnj.id ? this.pnjService.updatePnj(pnj) : this.pnjService.createPnj(pnj);
        this.subs = actionService.subscribe({
          next: () => {
            this.spinner.hide();
            this.getPnj();
          },
          error: () => {
            this.spinner.hide();
          }
        });
      }
    });
  }
  deletePnj(pnj: BolHerosModel, event: any) {
    this.spinner.show();
    this.subs?.unsubscribe();
    this.subs = this.pnjService.deletePnj(pnj.id as string).subscribe({
      next: () => {
        this.spinner.hide();
        this.getPnj();
      },
      error: () => {
        this.spinner.hide();
      }
    });

  }
}
