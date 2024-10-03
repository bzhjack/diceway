import {Component, inject, OnDestroy, ViewChild} from '@angular/core';
import {Button, ButtonDirective} from "primeng/button";
import {CheckboxModule} from "primeng/checkbox";
import {ConfirmPopupModule} from "primeng/confirmpopup";
import {DialogModule} from "primeng/dialog";
import {DropdownModule} from "primeng/dropdown";
import {HeaderComponent} from "../../../shared/header/header.component";
import {IconFieldModule} from "primeng/iconfield";
import {InputIconModule} from "primeng/inputicon";
import {InputTextModule} from "primeng/inputtext";
import {NgForOf, NgIf, NgOptimizedImage} from "@angular/common";
import {PaginatorModule} from "primeng/paginator";
import {ConfirmationService, PrimeTemplate} from "primeng/api";
import {Ripple} from "primeng/ripple";
import {Router, RouterLink} from "@angular/router";
import {Table, TableModule} from "primeng/table";
import {TagModule} from "primeng/tag";
import {TooltipModule} from "primeng/tooltip";
import {DialogService} from "primeng/dynamicdialog";
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgxSpinnerService} from "ngx-spinner";
import {Subscription} from "rxjs";
import {BolQuestService} from "../../services/bol-quest.service";
import {BolQuestModel} from "../../models/bol-quest.model";
import {BolHerosTraitRowComponent} from "../../heros/create/origines/region/trait-row/trait-row.component";
import {ScrollPanelModule} from "primeng/scrollpanel";
import {InputTextareaModule} from "primeng/inputtextarea";

@Component({
  selector: 'bol-quest-home',
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
    PaginatorModule,
    PrimeTemplate,
    Ripple,
    RouterLink,
    TableModule,
    TagModule,
    TooltipModule,
    BolHerosTraitRowComponent,
    ScrollPanelModule,
    Button,
    ReactiveFormsModule,
    InputTextareaModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  providers: [
    ConfirmationService
  ]
})
export class BolQuestHomeComponent implements OnDestroy {
  @ViewChild('questTable') questTable?: Table;
  private confirmationService = inject(ConfirmationService);
  readonly dialogueService = inject(DialogService);
  private questService = inject(BolQuestService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  public searchTerm: string | null = null;
  private spinner = inject(NgxSpinnerService);
  private subs?: Subscription;
  private subsQuest?: Subscription;
  public questList: Array<BolQuestModel> = [];
  public filteredQuestList: Array<BolQuestModel> = [];
  public searchPending: boolean = false;
  public showCreate = false;
  public titreCtrl = new FormControl('', [Validators.required, Validators.minLength(3)]);
  public commentaireCtrl = new FormControl('', [Validators.minLength(3)]);
  public questForm = this.fb.group({titre: this.titreCtrl, commentaire: this.commentaireCtrl});

  constructor() {
    this.getQuests();
  }

  ngOnDestroy() {
    this.subsQuest?.unsubscribe();
    this.subs?.unsubscribe();
  }

  getQuests() {
    this.spinner.show();
    this.subsQuest?.unsubscribe();

    // Supposons que `hs.heroes()` et `hs.anotherRequest()` sont les deux requêtes HTTP que vous souhaitez lancer en parallèle
    const questRequest = this.questService.quests();

    this.subsQuest = questRequest.subscribe({
      next: (heroes) => {
        this.questList = heroes;
        this.filteredQuestList = heroes;
        this.spinner.hide();
      },
      error: (error) => {
        this.spinner.hide();
      }
    });
  }
  filtering(ev: any) {
    this.questTable?.filterGlobal(ev.target?.value, 'contains')
  }
  clear(table?: Table) {
    table?.clear();
    this.searchTerm = '';
    this.searchPending = false;
  }
  openCreateDialog() {
    this.showCreate = true;
    this.questForm.reset();
  }
  createQuest() {
    if (this.questForm.valid) {
      this.showCreate = false;
      const quest = this.questForm.value;
      this.spinner.show();
      this.subs?.unsubscribe();
      this.subs = this.questService.createQuest(this.questForm.value as BolQuestModel).subscribe({
        next: (quest: BolQuestModel) => {
          this.spinner.hide();
          this.router.navigate(['bol', 'quest', 'create', quest.id]);
        },
        error: () => {
          this.spinner.hide();
        }
      });
    }
  }
  onError(controlName: string) {
    const control = this.questForm.get(controlName);
    return control?.dirty && control.invalid;
  }
}
