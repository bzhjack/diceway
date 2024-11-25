import {Component, inject, OnDestroy, signal, ViewChild} from '@angular/core';
import {RouterLink} from "@angular/router";
import {BolCreaturesService} from "../../services/bol-creatures.service";
import {NgxSpinnerService} from "ngx-spinner";
import {exhaustMap, filter, Subscription} from "rxjs";
import {BolCreatureModel} from "../../models/bol-creature.model";
import {CardModule} from "primeng/card";
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";
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
import {TagModule} from 'primeng/tag';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {CheckboxModule} from 'primeng/checkbox';
import {toObservable, toSignal} from "@angular/core/rxjs-interop";
import {BolQuestService} from "../../services/bol-quest.service";
import {BolQuestModel} from "../../models/bol-quest.model";
import {tap} from "rxjs/operators";
import {SkeletonModule} from "primeng/skeleton";
import {InlineSVGModule} from "ng-inline-svg-2";

@Component({
    selector: 'bol-creature-home',
  imports: [
    RouterLink,
    CardModule,
    CheckboxModule,
    NgForOf,
    HeaderComponent,
    ButtonDirective,
    Button,
    TagModule,
    DialogModule,
    AvatarModule,
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
    IconFieldModule,
    AsyncPipe,
    SkeletonModule,
    InlineSVGModule
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

  private subsBestiary?: Subscription;
  public beast: Array<BolCreatureModel> = [];
  public filteredBeast: Array<BolCreatureModel> = [];
  private subs: Subscription | undefined;
  private ref?: DynamicDialogRef;
  public showBeast: boolean = false;
  public currentBeast: BolCreatureModel | null = null;

  public searchCreation: boolean = false;
  public searchTaille: number | null = null;
  public searchTerm: string | null = null;
  public tailleList = toSignal(this.creatureService.tailles());

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
            this.clear();
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
        this.clear();
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

  filterExtended() {
    this.filteredBeast = this.searchCreation ? this.beast.filter((beast) => beast.user_id !== null) : this.beast;
    if (this.searchTaille !== null) {
      this.filteredBeast = this.filteredBeast.filter((beast) => beast.id_taille === this.searchTaille);
    }
  }

  showBeastPicture(beast: BolCreatureModel) {
    this.showBeast = true;
    this.currentBeast = beast;
  }

  clear(table?: Table) {
    table?.clear();
    this.searchTerm = '';
    this.searchTaille = null;
    this.searchCreation = false;
    this.filterExtended();
  }
  addAdventure(beast: BolCreatureModel) {
    this.currentBeast = beast;
    this.showCard.set(true);
    this.selectedQuest.set(null);
  }

  addToAdventure() {
    this.showCard.set(false);
    if (this.selectedQuest()) {
      const questId = this.selectedQuest()?.id ?? '';
      this.spinner.show();
      this.subs?.unsubscribe();
      this.subs = this.questService.addProtagonistToQuest(this.currentBeast!, questId, 'C').subscribe({
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
