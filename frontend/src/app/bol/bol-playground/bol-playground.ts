import {AfterViewInit, Component, ElementRef, HostListener, inject, signal, ViewChild} from '@angular/core';
import {Topbar} from '../../topbar/topbar';
import {CoreShapeComponent, StageComponent} from 'ng2-konva';
import Konva from 'konva';
import {BolHerosService} from '../bol-services/bol-heros.service';
import {ButtonModule} from 'primeng/button';
import { ButtonGroupModule } from 'primeng/buttongroup';
import StageConfig = Konva.StageConfig;
import CircleConfig = Konva.CircleConfig;
import {BolHerosModel} from '../bol-models/bol-heros.model';
import {BolHerosForm} from '../bol-heros/bol-hero-form/bol-hero-form';
import {DialogService} from 'primeng/dynamicdialog';
import {Subscription} from 'rxjs';
import {NgxSpinnerService} from 'ngx-spinner';

type ExtCircleConfig = CircleConfig;

@Component({
  selector: 'app-bol-playground',
  imports: [
    Topbar,
    StageComponent,
    CoreShapeComponent,
    ButtonModule,
    ButtonGroupModule
  ],
  providers: [DialogService],
  templateUrl: './bol-playground.html',
  styleUrl: './bol-playground.scss',
})
export class BolPlayground implements AfterViewInit {
  private readonly herosService = inject(BolHerosService);
  private readonly dialogueService = inject(DialogService);
  private readonly spinner = inject(NgxSpinnerService);

  private subs?: Subscription;
  public circleConfigs: ExtCircleConfig[] = [];
  public configStage: Partial<StageConfig> = {};
  questLoaded = signal<boolean>(false);
  items: { label?: string; icon?: string; separator?: boolean }[] = [];
  @HostListener('window:resize', [])
  onResize() {
    this.fitStageIntoParentContainer();
  }
  @ViewChild('playgroundContainer')
  playgroundContainer!: ElementRef;
  constructor() {
    this.items = [
      {
        label: 'Refresh',
        icon: 'pi pi-refresh'
      },
      {
        label: 'Search',
        icon: 'pi pi-search'
      },
      {
        separator: true
      },
      {
        label: 'Delete',
        icon: 'pi pi-times'
      }
    ];
    this.herosService.heroes().subscribe(heroes => {
      console.log(heroes);
    })
  }


  quickCreateHeros(heros?: BolHerosModel) {
    let ref = this.dialogueService.open(BolHerosForm, {
      header: heros ? 'Modification d\'un Héros' : 'Création d\'un Héros',
      dismissableMask :true,
      data: {
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
            //this.clear();
            //this.getHeroes();
          },
          error: () => {
            this.spinner.hide();
          }
        });
      }
    });
  }

  public ngAfterViewInit() {
    /*setTimeout(() => {
      this.fitStageIntoParentContainer();
      this.generateCircles();
    });*/
  }





  public handleDragstart(event: any): void {
    const shape = (event as any).target;

    this.circleConfigs = this.circleConfigs.map((conf) => {
      if (conf.name !== shape.name()) {
        return conf;
      }
      return {
        ...conf,
        shadowOffsetX: 15,
        shadowOffsetY: 15,
      };
    });
    this.circleConfigs = [
      ...this.circleConfigs.filter((conf) => conf.name !== shape.name()),
      this.circleConfigs.find((conf) => conf.name === shape.name())!,
    ];
  }
  public handleDragend(event: any): void {
    const shape = (event as any).target;
    this.circleConfigs = this.circleConfigs.map((conf) => {
      if (conf.name !== shape.name()) {
        return conf;
      }
      return {
        ...conf,
        x: shape.x(),
        y: shape.y(),
      };
    });
  }
  public trackConfig(index: number, config: ExtCircleConfig): string | undefined {
    return config.name;
  }
  private fitStageIntoParentContainer() {
    const container = this.playgroundContainer.nativeElement;
    const width = container.offsetWidth;
    const height = container.offsetHeight;

    const oldConfig = this.configStage;
    this.configStage = {
      width: width,
      height: height
    };
    if (oldConfig.width) {
      this.circleConfigs = this.circleConfigs.map((conf) => {
        return {
          ...conf,
          x: conf.x! * width / oldConfig.width!,
          y: conf.y! * height / oldConfig.height!,
        }
      });
    }
  }
  private generateCircles() {
    const radius = 30;
    for (let n = 0; n < 100; n++) {
      const circleConfig: ExtCircleConfig = {
        x: radius + (Math.random() * (this.configStage.width! - 2 * radius)),
        y: radius + (Math.random() * (this.configStage.height! - 2 * radius)),
        radius: radius,
        fill: '#89b717',
        opacity: 0.8,
        draggable: true,
        shadowColor: 'black',
        shadowBlur: 10,
        shadowOffsetX: 5,
        shadowOffsetY: 5,
        shadowOpacity: 0.6,
        name: n.toString(),
      };
      circleConfig.dragBoundFunc = (pos) => {
        const stageWidth = this.configStage.width!;
        const stageHeight = this.configStage.height!;

        const minX = radius;
        const maxX = stageWidth - radius;
        const newX = Math.max(minX, Math.min(pos.x, maxX));

        const minY = radius;
        const maxY = stageHeight - radius;
        const newY = Math.max(minY, Math.min(pos.y, maxY));

        return {
          x: newX,
          y: newY,
        };
      };
      this.circleConfigs.push(circleConfig);
    }
  }
}
