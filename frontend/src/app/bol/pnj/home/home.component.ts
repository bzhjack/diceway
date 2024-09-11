import {Component, inject, ViewChild} from '@angular/core';
import {Button, ButtonDirective} from "primeng/button";
import {DropdownModule} from "primeng/dropdown";
import {FormsModule} from "@angular/forms";
import {HeaderComponent} from "../../../shared/header/header.component";
import {InputTextModule} from "primeng/inputtext";
import {RouterLink} from "@angular/router";
import {BolPnjCreateComponent} from "../create/create.component";
import {DialogService, DynamicDialogRef} from "primeng/dynamicdialog";
import {Subscription} from "rxjs";
import {NgxSpinnerService} from "ngx-spinner";
import {BolHerosModel} from "../../models/bol-heros.model";
import {BolHerosService} from "../../services/bol-heros.service";
import {JsonPipe, NgForOf, NgIf} from "@angular/common";
import {BolCreatureCardComponent} from "../../creatures/card/card.component";
import {BolPnjCardComponent} from "../card/card.component";
import {ConfirmationService} from "primeng/api";
import {ConfirmPopupModule} from "primeng/confirmpopup";
import {CardModule} from "primeng/card";
import {Table, TableModule} from "primeng/table";
import {TooltipModule} from "primeng/tooltip";
import {CheckboxModule} from "primeng/checkbox";
import {IconFieldModule} from "primeng/iconfield";
import {InputIconModule} from "primeng/inputicon";
import {DialogModule} from "primeng/dialog";
import {Ripple} from "primeng/ripple";
import {TagModule} from "primeng/tag";

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
    ConfirmPopupModule,
    CardModule,
    NgIf,
    TableModule,
    TooltipModule,
    CheckboxModule,
    IconFieldModule,
    InputIconModule,
    DialogModule,
    Ripple,
    TagModule,
    JsonPipe
  ],
  providers: [
    ConfirmationService
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class BolPnjHomeComponent {
  private confirmationService = inject(ConfirmationService);
  private pnjService = inject(BolHerosService);
  private spinner = inject(NgxSpinnerService);
  readonly #ds = inject(DialogService);
  private subs: Subscription | undefined;
  private subsPnj: Subscription | undefined;
  private ref?: DynamicDialogRef;
  public pnjList: Array<BolHerosModel> = [];
  public filteredPnjList: Array<BolHerosModel> = [];
  public searchCreation: boolean = false;
  public searchType: 'P' | 'C' | 'R' | null = null;
  public searchTerm: string | null = null;
  public showPnj: boolean = false;
  public currentPnj: BolHerosModel | null = null;
  @ViewChild('pnjTable') pnjTable?: Table;
  public typeList = [
    {type: 'Tous', value: null},
    {type: 'Coriaces', value: 'C'},
    {type: 'Rivaux', value: 'R'},
    {type: 'Piétaille', value: 'P'},
  ];

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
        this.filteredPnjList = pnj;
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

  askDelete(pnj: BolHerosModel, event: any) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Voulez vous supprimer ce pnj ?',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      acceptLabel: "Oui",
      rejectLabel: "Non",
      accept: () => {
        this.deletePnj(pnj);
      },
    });
  }

  deletePnj(pnj: BolHerosModel) {
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

  filtering(ev: any) {
    this.pnjTable?.filterGlobal(ev.target?.value, 'contains')
  }
  filterExtended() {
    this.filteredPnjList = this.searchCreation ? this.pnjList.filter((pnj) => pnj.user_id !== null) : this.pnjList;
    if (this.searchType !== null) {
      this.filteredPnjList = this.filteredPnjList.filter((pnj) => pnj.type === this.searchType);
    }
  }
  showPnjPicture(pnj: BolHerosModel) {
    this.showPnj = true;
    this.currentPnj = pnj;
  }
  getType(pnj: BolHerosModel) {
    switch (pnj?.type) {
      case 'C':
        return 'Coriaces';
      case 'R':
        return 'Rivaux';
      case 'P':
        return 'Piétaille';
    }
    return '';
  }
  clear(table: Table) {
    table.clear();
    this.searchTerm = '';
    this.searchType = null;
    this.searchCreation = false;
    this.filterExtended();
  }
}
