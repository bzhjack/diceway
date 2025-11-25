import {AfterViewInit, Component, ElementRef, inject, signal, ViewChild} from '@angular/core';
import Konva from 'konva';
import {BolHerosService} from '../bol-services/bol-heros.service';
import {ButtonModule} from 'primeng/button';
import {ButtonGroupModule} from 'primeng/buttongroup';
import {BolHerosModel} from '../bol-models/bol-heros.model';
import {BolHerosForm} from '../bol-heros/bol-hero-form/bol-hero-form';
import {DialogService} from 'primeng/dynamicdialog';
import {Subscription} from 'rxjs';
import {NgxSpinnerService} from 'ngx-spinner';
import {Battlemap} from './battlemap/battlemap';
import {Topbar} from '../../shared/topbar/topbar';
import {Menubar} from 'primeng/menubar';
import {MenuItem, MenuItemCommandEvent} from 'primeng/api';
import StageConfig = Konva.StageConfig;
import CircleConfig = Konva.CircleConfig;
import {ContextMenu} from 'primeng/contextmenu';
import {BolPnjForm} from '../bol-pnj/bol-pnj-form/bol-pnj-form';

type ExtCircleConfig = CircleConfig;

@Component({
  selector: 'app-bol-playground',
  imports: [
    Topbar,
    ButtonModule,
    ButtonGroupModule,
    Battlemap,
    Menubar,
    ContextMenu
  ],
  providers: [DialogService],
  templateUrl: './bol-playground.html',
  styleUrl: './bol-playground.scss',
  standalone: true
})
export class BolPlayground {
  private readonly herosService = inject(BolHerosService);
  private readonly dialogueService = inject(DialogService);
  private readonly spinner = inject(NgxSpinnerService);
  items: MenuItem[] = [];
  contextItems: MenuItem[] = [];
  private currentHero: BolHerosModel | undefined;
  public heroes: BolHerosModel[] = [];
  private subs?: Subscription;
  questLoaded = signal<boolean>(false);
  @ViewChild('playgroundContainer') playgroundContainer!: ElementRef;
  @ViewChild('cm') cm!: ContextMenu;

  constructor() {
    this.items = [
      {
        label: 'Créer un héros',
        icon: 'pi pi-plus',
        command: () => {
          this.heroForm();
        }
      },
      {
        label: 'Créer un Pnj',
        icon: 'pi pi-plus',
        command: () => {
          this.pnjForm();
        }
      }
    ]
    this.contextItems = [
      {
        label: 'Modification',
        icon: 'pi pi-file-edit' ,
        command: (event: MenuItemCommandEvent) => {
          this.heroForm(this.currentHero);
        }
      }
    ];
    this.getHeroes();
  }
  getHeroes() {
    this.herosService.heroes().subscribe(heroes => {
      this.heroes = heroes;
    })
  }
  contextMenu(ev: any): void {
    this.currentHero = ev.hero;
    this.cm.show(ev.event);
  }
  heroForm(heros?: BolHerosModel) {
    let ref = this.dialogueService.open(BolHerosForm, {
      dismissableMask: true,
      position: "top",
      showHeader: false,
      data: {
        header: heros ? 'Modification d\'un Héros' : 'Création d\'un Héros',
        heros: heros
      }
    });
    this.subs?.unsubscribe();
    this.subs = ref?.onClose.subscribe((heros: BolHerosModel) => {
      if (heros) {
        this.spinner.show();
        this.subs?.unsubscribe();
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
  pnjForm(heros?: BolHerosModel) {
    let ref = this.dialogueService.open(BolPnjForm, {
      dismissableMask: true,
      position: "top",
      showHeader: false,
      data: {
        header: heros ? 'Modification d\'un PNJ' : 'Création d\'un PNJ',
        heros: heros
      }
    });
    this.subs?.unsubscribe();
    this.subs = ref?.onClose.subscribe((heros: BolHerosModel) => {
      if (heros) {
        this.spinner.show();
        this.subs?.unsubscribe();
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
