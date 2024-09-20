import {Component, inject, ViewChild} from '@angular/core';
import {ConfirmationService, PrimeTemplate} from 'primeng/api';
import {BolDemonsService} from '../../services/bol-demons.service';
import {DialogService, DynamicDialogRef} from 'primeng/dynamicdialog';
import {NgxSpinnerService} from 'ngx-spinner';
import {Subscription} from 'rxjs';
import {ButtonDirective} from "primeng/button";
import {CheckboxModule} from "primeng/checkbox";
import {ConfirmPopupModule} from "primeng/confirmpopup";
import {DialogModule} from "primeng/dialog";
import {DropdownModule} from "primeng/dropdown";
import {HeaderComponent} from "../../../shared/header/header.component";
import {IconFieldModule} from "primeng/iconfield";
import {InputIconModule} from "primeng/inputicon";
import {InputTextModule} from "primeng/inputtext";
import {JsonPipe, NgForOf, NgIf, NgOptimizedImage} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {Ripple} from "primeng/ripple";
import {RouterLink} from "@angular/router";
import {Table, TableModule} from "primeng/table";
import {TagModule} from "primeng/tag";
import {TooltipModule} from "primeng/tooltip";
import {toSignal} from "@angular/core/rxjs-interop";
import {BolDemonModel} from "../../models/bol-demon.model";
import {BolCreatureModel} from "../../models/bol-creature.model";
import {BolDemonCreateComponent} from "../create/create.component";

@Component({
  selector: 'bol-demon-home',
  standalone: true,
  imports: [
    ButtonDirective,
    CheckboxModule,
    ConfirmPopupModule,
    DialogModule,
    DropdownModule,
    HeaderComponent,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    NgForOf,
    NgIf,
    NgOptimizedImage,
    PrimeTemplate,
    ReactiveFormsModule,
    Ripple,
    RouterLink,
    TableModule,
    TagModule,
    TooltipModule,
    FormsModule,
    JsonPipe
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  providers: [
    ConfirmationService
  ],
})
export class BolDemonHomeComponent {
  private confirmationService = inject(ConfirmationService);
  private demonService = inject(BolDemonsService);
  readonly #ds = inject(DialogService);
  private spinner = inject(NgxSpinnerService);
  private subsDemon?: Subscription;
  public demons: Array<any> = [];
  public filteredDemons: Array<any> = [];
  public searchCreation: boolean = false;
  public searchCategorie: number | null = null;
  public searchTerm: string | null = null;
  private subs: Subscription | undefined;
  private ref?: DynamicDialogRef;
  public showDemon: boolean = false;
  public currentDemon: BolDemonModel | null = null;

  public categorieList = toSignal(this.demonService.categories());
  @ViewChild('demonTable') demonTable?: Table;

  constructor() {
    this.getDemons();
  }

  getDemons() {
    this.spinner.show();
    this.subsDemon?.unsubscribe();

    // Supposons que `hs.heroes()` et `hs.anotherRequest()` sont les deux requêtes HTTP que vous souhaitez lancer en parallèle
    const creaturesRequest = this.demonService.demons();

    this.subsDemon = creaturesRequest.subscribe({
      next: (demons) => {
        this.demons = demons;
        this.filteredDemons = demons;
        this.spinner.hide();
      },
      error: () => {
        this.spinner.hide();
      }
    });
  }
  filtering(ev: any) {
    this.demonTable?.filterGlobal(ev.target?.value, 'contains')
  }
  filterExtended() {
    this.filteredDemons = this.searchCreation ? this.demons.filter((demon) => demon.user_id !== null) : this.demons;
    if (this.searchCategorie !== null) {
      this.filteredDemons = this.demons.filter((demon: BolDemonModel) => demon.id_categorie === this.searchCategorie);
    }
  }


  showDemonPicture(demon: BolDemonModel) {
    this.showDemon = true;
    this.currentDemon = demon;
  }

  clear(table?: Table) {
    table?.clear();
    this.searchTerm = '';
    this.searchCategorie = null;
    this.searchCreation = false;
    this.filterExtended();
  }

  createDemon(demon?: BolDemonModel) {
    this.ref = this.#ds.open(BolDemonCreateComponent, {
      header: demon ? 'Modification d\'un démon' : 'Création d\'un démon',
      data: {
        demon: demon
      }
    });
    this.subs?.unsubscribe();
    this.subs = this.ref.onClose.subscribe((demon: BolDemonModel) => {
      if (demon) {
        this.spinner.show();
        this.subs?.unsubscribe();
        const actionService = demon.id ? this.demonService.updateDemon(demon) : this.demonService.createDemon(demon);
        this.subs = actionService.subscribe({
          next: () => {
            this.spinner.hide();
            this.clear();
            this.getDemons();
          },
          error: () => {
            this.spinner.hide();
          }
        });
      }
    });
  }

}
