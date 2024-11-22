import {Component, inject, OnDestroy, signal, ViewChild} from '@angular/core';
import {ConfirmationService, PrimeTemplate} from 'primeng/api';
import {BolDemonsService} from '../../services/bol-demons.service';
import {DialogService, DynamicDialogRef} from 'primeng/dynamicdialog';
import {NgxSpinnerService} from 'ngx-spinner';
import {exhaustMap, filter, Subscription} from 'rxjs';
import {Button, ButtonDirective} from "primeng/button";
import {CheckboxModule} from "primeng/checkbox";
import {ConfirmPopupModule} from "primeng/confirmpopup";
import {DialogModule} from "primeng/dialog";
import {DropdownModule} from "primeng/dropdown";
import {HeaderComponent} from "../../../shared/header/header.component";
import {IconFieldModule} from "primeng/iconfield";
import {InputIconModule} from "primeng/inputicon";
import {InputTextModule} from "primeng/inputtext";
import {AsyncPipe, JsonPipe, NgForOf, NgIf} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {Ripple} from "primeng/ripple";
import {RouterLink} from "@angular/router";
import {Table, TableModule} from "primeng/table";
import {TagModule} from "primeng/tag";
import {TooltipModule} from "primeng/tooltip";
import {toObservable, toSignal} from "@angular/core/rxjs-interop";
import {BolDemonModel} from "../../models/bol-demon.model";
import {BolDemonCreateComponent} from "../create/create.component";
import {BolQuestModel} from "../../models/bol-quest.model";
import {tap} from "rxjs/operators";
import {BolQuestService} from "../../services/bol-quest.service";
import {SkeletonModule} from "primeng/skeleton";
import {InlineSVGModule} from "ng-inline-svg-2";

@Component({
    selector: 'bol-demon-home',
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
        PrimeTemplate,
        ReactiveFormsModule,
        Ripple,
        RouterLink,
        TableModule,
        TagModule,
        TooltipModule,
        FormsModule,
        JsonPipe,
        AsyncPipe,
        Button,
        SkeletonModule,
        InlineSVGModule
    ],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss',
    providers: [
        ConfirmationService
    ]
})
export class BolDemonHomeComponent implements OnDestroy {
  private confirmationService = inject(ConfirmationService);
  private demonService = inject(BolDemonsService);
  readonly #ds = inject(DialogService);
  private spinner = inject(NgxSpinnerService);
  private questService = inject(BolQuestService);

  public selectedQuest = signal<BolQuestModel | null>(null)
  public showCard = signal<boolean>(false);

  quests = signal<BolQuestModel[] | null>(null);
  quests$ = toObservable<boolean>(this.showCard).pipe(
    filter((show) => show),
    tap((id) => this.quests.set(null)),
    exhaustMap((id) =>
      this.questService.quests().pipe(
        tap((quests) => this.quests.set(quests))
      )
    )
  );

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

  askDelete(demon: BolDemonModel, event: any) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Voulez vous supprimer ce démon ?',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      acceptLabel: "Oui",
      rejectLabel: "Non",
      accept: () => {
        this.deleteDemon(demon);
      },
    });
  }

  deleteDemon(demon: BolDemonModel) {
    this.spinner.show();
    this.subs?.unsubscribe();
    this.subs = this.demonService.deleteDemon(demon.id as string).subscribe({
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

  ngOnDestroy() {
    this.subs?.unsubscribe();
    if (this.ref) {
      this.ref.close();
    }
  }
  addAdventure(demon: BolDemonModel) {
    this.currentDemon = demon;
    this.showCard.set(true);
    this.selectedQuest.set(null);
  }

  addToAdventure() {
    this.showCard.set(false);
    if (this.selectedQuest()) {
      const questId = this.selectedQuest()?.id ?? '';
      this.spinner.show();
      this.subs?.unsubscribe();
      this.subs = this.questService.addProtagonistToQuest(this.currentDemon!, questId, 'D').subscribe({
        next: () => {
          this.spinner.hide();
        },
        error: () => {
          this.spinner.hide();
        }
      });
    }
  }

}
