import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild
} from '@angular/core';
import {Topbar} from '../../topbar/topbar';
import {CoreShapeComponent, NgKonvaEventObject, StageComponent} from 'ng2-konva';
import Konva from 'konva';
import StageConfig = Konva.StageConfig;
import CircleConfig = Konva.CircleConfig;
import StarConfig = Konva.StarConfig;

type ExtStartConfig = StarConfig & { startScale: number };

@Component({
  selector: 'app-bol-playground',
  imports: [
    Topbar,
    StageComponent,
    CoreShapeComponent
  ],
  templateUrl: './bol-playground.html',
  styleUrl: './bol-playground.scss',
})
export class BolPlayground implements OnInit, AfterViewInit {
  public starConfigs: ExtStartConfig[] = [];

  public configStage: Partial<StageConfig> = {};

  @ViewChild('playgroundContainer')
  playgroundContainer!: ElementRef;

  public handleDragstart(
    event: any,
  ): void {
    const shape = (event as any).target;

    this.starConfigs = this.starConfigs.map((conf) => {
      if (conf.name !== shape.name()) {
        return conf;
      }
      return {
        ...conf,
        shadowOffsetX: 15,
        shadowOffsetY: 15,
        scaleX: conf.startScale * 1.2,
        scaleY: conf.startScale * 1.2,
      };
    });
    this.starConfigs = [
      ...this.starConfigs.filter((conf) => conf.name !== shape.name()),
      this.starConfigs.find((conf) => conf.name === shape.name())!,
    ];
  }

  public handleDragend(
    event: any,
  ): void {
    const shape = (event as any).target;
    this.starConfigs = this.starConfigs.map((conf) => {
      if (conf.name !== shape.name()) {
        return conf;
      }
      return {
        ...conf,
        x: shape.x(),
        y: shape.y(),
        scaleX: conf.startScale,
        scaleY: conf.startScale,
      };
    });
  }

  trackConfig(index: number, config: ExtStartConfig): string | undefined {
    return config.name;
  }

  public ngOnInit(): void {
  }

  public ngAfterViewInit() {
    setTimeout(() => {
      this.fitStageIntoParentContainer();
      this.generateStars();
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.fitStageIntoParentContainer();
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
      this.starConfigs = this.starConfigs.map((conf) => {
        return {
          ...conf,
          x: conf.x! * width / oldConfig.width!,
          y: conf.y! * height / oldConfig.height!,
        }
      });
    }
  }

  private generateStars() {
    for (let n = 0; n < 100; n++) {
      const scale = Math.random();
      const radius = 50 * scale;
      const starConfig: ExtStartConfig = {
        x: radius + (Math.random() * (this.configStage.width! - 2 * radius)),
        y: radius + (Math.random() * (this.configStage.height! - 2 * radius)),
        rotation: Math.random() * 180,
        numPoints: 5,
        innerRadius: 30,
        outerRadius: 50,
        fill: '#89b717',
        opacity: 0.8,
        draggable: true,
        scaleX: scale,
        scaleY: scale,
        shadowColor: 'black',
        shadowBlur: 10,
        shadowOffsetX: 5,
        shadowOffsetY: 5,
        shadowOpacity: 0.6,
        startScale: scale,
        name: n.toString(),
      };
      starConfig.dragBoundFunc = (pos) => {
        const stageWidth = this.configStage.width!;
        const stageHeight = this.configStage.height!;
        const radius = starConfig.outerRadius! * starConfig.startScale * 1.2;

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
      this.starConfigs.push(starConfig);
    }
  }
}
