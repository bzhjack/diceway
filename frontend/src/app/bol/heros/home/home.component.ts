import {Component, inject, OnDestroy, ViewChild} from '@angular/core';
import {Subscription} from "rxjs";
import {JsonPipe, NgForOf, NgIf, NgOptimizedImage} from "@angular/common";
import {Router, RouterLink} from "@angular/router";
import {NgxSpinnerService} from "ngx-spinner";
import {CardModule} from "primeng/card";
import {Button, ButtonDirective} from "primeng/button";
import {DialogModule} from "primeng/dialog";
import {InputTextModule} from "primeng/inputtext";
import {FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {Table, TableModule} from "primeng/table";
import {Ripple} from "primeng/ripple";
import {ConfirmPopupModule} from "primeng/confirmpopup";
import {ConfirmationService} from "primeng/api";
import {BolHerosService} from "../../services/bol-heros.service";
import {BolHerosModel} from "../../models/bol-heros.model";
import {HeaderComponent} from "../../../shared/header/header.component";
import {CheckboxModule} from "primeng/checkbox";
import {DropdownModule} from "primeng/dropdown";
import {IconFieldModule} from "primeng/iconfield";
import {InputIconModule} from "primeng/inputicon";
import {TagModule} from "primeng/tag";
import {TooltipModule} from "primeng/tooltip";
import {ScrollPanelModule} from "primeng/scrollpanel";
import {BolHerosUpdateComponent} from "../update/update.component";
import {DialogService, DynamicDialogRef} from "primeng/dynamicdialog";


@Component({
  selector: 'bol-hero-home',
  standalone: true,
    imports: [
        NgForOf,
        JsonPipe,
        RouterLink,
        CardModule,
        Button,
        DialogModule,
        InputTextModule,
        ReactiveFormsModule,
        NgIf,
        TableModule,
        ButtonDirective,
        Ripple,
        ConfirmPopupModule,
        HeaderComponent,
        CheckboxModule,
        DropdownModule,
        IconFieldModule,
        InputIconModule,
        TagModule,
        TooltipModule,
        FormsModule,
        NgOptimizedImage,
        ScrollPanelModule
    ],
  providers: [
    ConfirmationService
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class BolHeroHomeComponent implements OnDestroy {
  @ViewChild('herosTable') herosTable?: Table;
  private confirmationService = inject(ConfirmationService);
  readonly dialogueService = inject(DialogService);
  private herosService = inject(BolHerosService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private spinner = inject(NgxSpinnerService);
  private ref?: DynamicDialogRef;

  private subs?: Subscription;
  private subsHeroes?: Subscription;
  public heroesList: Array<BolHerosModel> = [];
  public filteredHeroesList: Array<BolHerosModel> = [];
  public searchTerm: string | null = null;
  public showHeros: boolean = false;
  public currentHeros: BolHerosModel | null = null;
  public searchPending: boolean = false;


  public showCreate = false;
  public joueurCtrl = new FormControl('', [Validators.required, Validators.minLength(3)]);
  public nomCtrl = new FormControl('', [Validators.required, Validators.minLength(3)]);
  herosForm = this.fb.group({joueur: this.joueurCtrl, nom: this.nomCtrl});

  constructor() {
    this.getHeroes();
  }

  getHeroes() {
    this.spinner.show();
    this.subsHeroes?.unsubscribe();

    // Supposons que `hs.heroes()` et `hs.anotherRequest()` sont les deux requêtes HTTP que vous souhaitez lancer en parallèle
    const heroesRequest = this.herosService.heroes();

    this.subsHeroes = heroesRequest.subscribe({
      next: (heroes) => {
        this.heroesList = heroes;
        this.filteredHeroesList = heroes;
        this.spinner.hide();
      },
      error: (error) => {
        this.spinner.hide();
      }
    });
  }


  openCreateDialog() {
    this.showCreate = true;
    this.herosForm.reset();
  }

  createHero() {
    if (this.herosForm.valid) {
      this.showCreate = false;
      const hero = this.herosForm.value;
      this.spinner.show();
      this.subs?.unsubscribe();
      this.subs = this.herosService.createHeros(this.herosForm.value as BolHerosModel).subscribe({
        next: (hero: BolHerosModel) => {
          this.spinner.hide();
          this.router.navigate(['bol', 'heros', 'create', hero.id]);
        },
        error: () => {
          this.spinner.hide();
        }
      });

    }
  }

  deleteHero(heros: BolHerosModel, event: any) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Voulez vous supprimer ce personnage ?',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      acceptLabel: "Oui",
      rejectLabel: "Non",
      accept: () => {
        this.spinner.show();
        this.subs?.unsubscribe();
        this.subs = this.herosService.deleteHeros(heros.id as string).subscribe({
          next: (hero: BolHerosModel) => {
            this.spinner.hide();
            this.getHeroes();
          },
          error: () => {
            this.spinner.hide();
          }
        });
      },
    });
  }

  onError(controlName: string) {
    const control = this.herosForm.get(controlName);
    return control?.dirty && control.invalid;
  }

  ngOnDestroy() {
    this.subs?.unsubscribe();
    this.subsHeroes?.unsubscribe();
  }

  filtering(ev: any) {
    this.herosTable?.filterGlobal(ev.target?.value, 'contains')
  }
  filterExtended() {
    this.filteredHeroesList = this.searchPending ? this.heroesList.filter((heros) => !heros.active) : this.heroesList;
  }
  showHerosPicture(heros: BolHerosModel) {
    this.showHeros = true;
    this.currentHeros = heros;
  }

  clear(table: Table) {
    table.clear();
    this.searchTerm = '';
    this.searchPending = false;
    this.filterExtended();
  }
  quickCreateHeros(heros?: BolHerosModel) {
    this.ref = this.dialogueService.open(BolHerosUpdateComponent, {
      header: heros ? 'Modification d\'un Héros' : 'Création d\'un Héros',
      data: {
        heros: heros
      }
    });
    this.subs?.unsubscribe();
    this.subs = this.ref.onClose.subscribe((heros: BolHerosModel) => {
      if (heros) {
        this.spinner.show();
        this.subs?.unsubscribe();
        heros.joueur = 'master';
        const actionService = heros.id ? this.herosService.quickUpdate(heros) : this.herosService.quickCreate(heros);
        this.subs = actionService.subscribe({
          next: () => {
            this.spinner.hide();
            this.getHeroes();
          },
          error: () => {
            this.spinner.hide();
          }
        });
      }
    });
  }
}









