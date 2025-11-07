import { Component, ElementRef, Input, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import Konva from 'konva';
@Component({
  selector: 'app-battlemap',
  imports: [],
  templateUrl: './battlemap.html',
  styleUrl: './battlemap.scss',
})
export class Battlemap implements OnInit, AfterViewInit {
  @ViewChild('battlemapContainer', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  @Input() cellSize = 48;
  @Input() cols = 16;
  @Input() rows = 12;

  private stage!: Konva.Stage;
  private gridLayer!: Konva.Layer;
  private tokenLayer!: Konva.Layer;
  private selectedToken: Konva.Group | null = null;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initStage();
    this.drawGrid();
    this.addSampleTokens();
  }

  private initStage(): void {
    const width = this.cols * this.cellSize;
    const height = this.rows * this.cellSize;

    this.stage = new Konva.Stage({
      container: this.containerRef.nativeElement,
      width,
      height,
    });

    this.gridLayer = new Konva.Layer();
    this.tokenLayer = new Konva.Layer();

    this.stage.add(this.gridLayer);
    this.stage.add(this.tokenLayer);

    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  private drawGrid(): void {
    this.gridLayer.destroyChildren();
    const { cols, rows, cellSize } = this;
    const width = cols * cellSize;
    const height = rows * cellSize;

    this.gridLayer.add(new Konva.Rect({
      x: 0, y: 0, width, height, fill: '#f6f6f6'
    }));

    for (let c = 0; c <= cols; c++) {
      this.gridLayer.add(new Konva.Line({
        points: [c * cellSize, 0, c * cellSize, height],
        stroke: '#bbb',
        strokeWidth: 1
      }));
    }

    for (let r = 0; r <= rows; r++) {
      this.gridLayer.add(new Konva.Line({
        points: [0, r * cellSize, width, r * cellSize],
        stroke: '#bbb',
        strokeWidth: 1
      }));
    }

    this.gridLayer.draw();
  }

  private createToken(col: number, row: number, color: string, label: string = ''): void {
    const { cellSize } = this;
    const x = col * cellSize;
    const y = row * cellSize;

    const group = new Konva.Group({
      x, y,
      draggable: true,
      width: cellSize,
      height: cellSize,
      name: 'token'
    });

    const circle = new Konva.Circle({
      x: cellSize / 2,
      y: cellSize / 2,
      radius: cellSize / 2 - 5,
      fill: color,
      stroke: '#222',
      strokeWidth: 2
    });

    const text = new Konva.Text({
      x: 0,
      y: cellSize / 2 - 8,
      width: cellSize,
      align: 'center',
      text: label,
      fontSize: Math.max(12, Math.round(cellSize / 4)),
      fontStyle: 'bold',
      fill: '#fff'
    });

    group.add(circle);
    group.add(text);

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

    this.tokenLayer.add(group);
    this.tokenLayer.draw();
  }

  private addSampleTokens(): void {
    this.createToken(1, 1, '#e74c3c', 'A');
    this.createToken(3, 2, '#3498db', 'B');
    this.createToken(2, 5, '#2ecc71', 'C');
  }

  private snapToGrid(x: number, y: number): { x: number; y: number } {
    const gx = Math.max(0, Math.min(this.stage.width() - this.cellSize, Math.round(x / this.cellSize) * this.cellSize));
    const gy = Math.max(0, Math.min(this.stage.height() - this.cellSize, Math.round(y / this.cellSize) * this.cellSize));
    return { x: gx, y: gy };
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
      listening: false
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
