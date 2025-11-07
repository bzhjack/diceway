import { Component, ElementRef, effect, model, AfterViewInit, ViewChild, OnDestroy, Input } from '@angular/core';
import Konva from 'konva';

@Component({
  selector: 'app-battlemap',
  templateUrl: './battlemap.html',
  styleUrl: './battlemap.scss',
})
export class Battlemap implements AfterViewInit, OnDestroy {
  @ViewChild('battlemapContainer', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  @Input() cellSize = 48;
  tokens = model<any[]>([]);

  private stage!: Konva.Stage;
  private gridLayer!: Konva.Layer;
  private tokenLayer!: Konva.Layer;
  private selectedToken: Konva.Group | null = null;
  private resizeObserver!: ResizeObserver;

  private cols = 0;
  private rows = 0;

  constructor() {
    effect(() => {
      if (this.tokens().length) {
        this.drawTokens();
      }
    });
  }

  ngAfterViewInit(): void {
    this.initStage();
    this.fitToContainer();
    this.drawTokens();

    // Redimensionnement dynamique
    this.resizeObserver = new ResizeObserver(() => {
      this.fitToContainer();
      this.drawTokens();
    });
    this.resizeObserver.observe(this.containerRef.nativeElement);

    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private initStage(): void {
    this.stage = new Konva.Stage({
      container: this.containerRef.nativeElement,
      width: 0,
      height: 0,
    });

    this.gridLayer = new Konva.Layer();
    this.tokenLayer = new Konva.Layer();

    this.stage.add(this.gridLayer);
    this.stage.add(this.tokenLayer);
  }

  private fitToContainer(): void {
    const container = this.containerRef.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // recalculer colonnes et lignes selon la taille
    this.cols = Math.floor(width / this.cellSize);
    this.rows = Math.floor(height / this.cellSize);

    // redimensionner le canvas
    this.stage.width(this.cols * this.cellSize);
    this.stage.height(this.rows * this.cellSize);

    this.drawGrid();
  }

  private drawGrid(): void {
    this.gridLayer.destroyChildren();

    const width = this.cols * this.cellSize;
    const height = this.rows * this.cellSize;

    for (let c = 0; c <= this.cols; c++) {
      this.gridLayer.add(new Konva.Line({
        points: [c * this.cellSize, 0, c * this.cellSize, height],
        stroke: '#bbb',
        strokeWidth: 1,
      }));
    }

    for (let r = 0; r <= this.rows; r++) {
      this.gridLayer.add(new Konva.Line({
        points: [0, r * this.cellSize, width, r * this.cellSize],
        stroke: '#bbb',
        strokeWidth: 1,
      }));
    }

    this.gridLayer.draw();
  }

  private drawTokens(): void {
    if (!this.stage) {
      return;
    }
    this.tokenLayer.destroyChildren();
    console.log('draw', this.tokens());
    // Positionner les tokens automatiquement sur la grille
    this.tokens().forEach((token, index) => {
      const col = index % this.cols;
      const row = Math.floor(index / this.cols);

      this.createToken(
        col,
        row,
        token.origines?.avatar || null,
        token.origines?.nom || `#${index + 1}`
      );
    });

    this.tokenLayer.draw();
  }

  private snapToGrid(x: number, y: number): { x: number; y: number } {
    const gx = Math.max(0, Math.min(this.stage.width() - this.cellSize, Math.round(x / this.cellSize) * this.cellSize));
    const gy = Math.max(0, Math.min(this.stage.height() - this.cellSize, Math.round(y / this.cellSize) * this.cellSize));
    return { x: gx, y: gy };
  }

  private createToken(col: number, row: number, avatar: string | null, label: string): void {
    const x = col * this.cellSize;
    const y = row * this.cellSize;

    const group = new Konva.Group({
      x, y,
      draggable: true,
      width: this.cellSize,
      height: this.cellSize,
      name: 'token',
    });

    // Si l'avatar est une image valide
    if (avatar && (avatar.startsWith('data:image') || avatar.startsWith('http'))) {
      const imageObj = new Image();
      imageObj.src = avatar;

      imageObj.onload = () => {
        const image = new Konva.Image({
          image: imageObj,
          x: 0,
          y: 0,
          width: this.cellSize,
          height: this.cellSize,
          clipFunc: (ctx: CanvasRenderingContext2D) => {
            ctx.arc(this.cellSize / 2, this.cellSize / 2, this.cellSize / 2 - 2, 0, Math.PI * 2, false);
          },
        });
        group.add(image);
        group.add(this.createTokenLabel(label));
        this.addTokenInteractions(group);
        this.tokenLayer.add(group);
        this.tokenLayer.draw();
      };
    } else {
      // Cercle par défaut
      const circle = new Konva.Circle({
        x: this.cellSize / 2,
        y: this.cellSize / 2,
        radius: this.cellSize / 2 - 5,
        fill: '#3498db',
        stroke: '#222',
        strokeWidth: 2,
      });

      group.add(circle);
      group.add(this.createTokenLabel(label));
      this.addTokenInteractions(group);
      this.tokenLayer.add(group);
      this.tokenLayer.draw();
    }
  }

  private createTokenLabel(label: string): Konva.Text {
    return new Konva.Text({
      x: 0,
      y: this.cellSize / 2 - 8,
      width: this.cellSize,
      align: 'center',
      text: label,
      fontSize: Math.max(12, Math.round(this.cellSize / 4)),
      fontStyle: 'bold',
      fill: '#fff',
      shadowColor: 'black',
      shadowBlur: 4,
      shadowOffset: { x: 1, y: 1 },
    });
  }

  private addTokenInteractions(group: Konva.Group): void {
    group.on('dragend', () => {
      const pos = this.snapToGrid(group.x(), group.y());
      group.position(pos);

      this.tokenLayer.draw();
    });
    group.on('click', (e) => {
      e.cancelBubble = true;
      this.selectToken(group);
    });

    group.on('dragstart', () => {
      group.moveToTop();
      this.selectToken(group);
    });
  }

  private selectToken(group: Konva.Group | null): void {
    if (this.selectedToken && (this.selectedToken as any)._selectionRect) {
      (this.selectedToken as any)._selectionRect.destroy();
    }
    this.selectedToken = group;
    if (!group) return;

    const rect = new Konva.Rect({
      x: 0, y: 0,
      width: this.cellSize,
      height: this.cellSize,
      stroke: '#000',
      dash: [6, 4],
      strokeWidth: 2,
      listening: false,
    });

    group.add(rect);
    (group as any)._selectionRect = rect;
    this.tokenLayer.draw();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.selectedToken) return;

    const { key } = e;
    let dx = 0, dy = 0;

    if (key === 'ArrowLeft') dx = -1;
    else if (key === 'ArrowRight') dx = 1;
    else if (key === 'ArrowUp') dy = -1;
    else if (key === 'ArrowDown') dy = 1;
    else return;

    e.preventDefault();
    const newX = this.selectedToken.x() + dx * this.cellSize;
    const newY = this.selectedToken.y() + dy * this.cellSize;
    const pos = this.snapToGrid(newX, newY);

    this.selectedToken.position(pos);
    this.tokenLayer.draw();
  }
}
