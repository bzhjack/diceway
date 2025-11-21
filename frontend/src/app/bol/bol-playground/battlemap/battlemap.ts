import {
  Component,
  ElementRef,
  effect,
  model,
  AfterViewInit,
  ViewChild,
  OnDestroy,
  Input,
  EventEmitter, Output
} from '@angular/core';
import Konva from 'konva';
import {BolHerosModel} from '../../bol-models/bol-heros.model';
import {debounceTime, Subject} from 'rxjs';

@Component({
  selector: 'app-battlemap',
  templateUrl: './battlemap.html',
  styleUrl: './battlemap.scss',
})
export class Battlemap implements AfterViewInit, OnDestroy {
  @ViewChild('battlemapContainer', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  @Input() cellSize = 48;
  @Output() tokenDoubleClick = new EventEmitter<BolHerosModel>();
  @Output() contextMenu = new EventEmitter<any>();
  private tokenPositions = new Map<string | null, { col: number; row: number }>();
  tokens = model<BolHerosModel[]>([]);
  private resize$ = new Subject<void>();
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
    const saved = localStorage.getItem('battlemap_positions');
    if (saved) {
      this.tokenPositions = new Map(JSON.parse(saved));
    }
    this.initStage();
    this.fitToContainer();
    this.drawTokens();

    // Debounce du resize
    this.resize$
      .pipe(debounceTime(150))
      .subscribe(() => {
        this.fitToContainer();
        this.clampTokensInsideGrid();
        this.drawTokens();
      });

    this.resizeObserver = new ResizeObserver(() => {
      this.resize$.next();
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

  private clampTokensInsideGrid(): void {
    let updated = false;

    this.tokens().forEach(hero => {
      const pos = this.tokenPositions.get(hero.id);
      if (!pos) return;

      let { col, row } = pos;

      // Vérifier les limites
      const maxCol = this.cols - 1;
      const maxRow = this.rows - 1;

      let clamped = false;

      if (col > maxCol) {
        col = maxCol;
        clamped = true;
      }
      if (row > maxRow) {
        row = maxRow;
        clamped = true;
      }

      if (col < 0) {
        col = 0;
        clamped = true;
      }
      if (row < 0) {
        row = 0;
        clamped = true;
      }

      // Si on a dû corriger, on sauvegarde
      if (clamped) {
        this.tokenPositions.set(hero.id, { col, row });
        updated = true;
      }
    });

    if (updated) {
      localStorage.setItem('battlemap_positions', JSON.stringify([...this.tokenPositions]));
    }
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
    // Positionner les tokens automatiquement sur la grille
    this.tokens().forEach((token, index) => {

      const savedPos = this.tokenPositions.get(token.id);

      let col: number;
      let row: number;

      if (savedPos) {
        col = savedPos.col;
        row = savedPos.row;
      } else {
        // fallback si aucune position stockée
        col = index % this.cols;
        row = Math.floor(index / this.cols);

        // stocker la position par défaut
        this.tokenPositions.set(token.id, { col, row });
      }

      this.createToken(
        col,
        row,
        token.origines?.avatar || null,
        token.origines?.nom || `#${index + 1}`,
        token
      );
    });

    this.tokenLayer.draw();
  }

  private snapToGrid(x: number, y: number): { x: number; y: number } {
    const gx = Math.max(0, Math.min(this.stage.width() - this.cellSize, Math.round(x / this.cellSize) * this.cellSize));
    const gy = Math.max(0, Math.min(this.stage.height() - this.cellSize, Math.round(y / this.cellSize) * this.cellSize));
    return { x: gx, y: gy };
  }

  private createToken(col: number, row: number, avatar: string | null, label: string, hero: BolHerosModel): void {
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
        this.addTokenInteractions(group, hero);
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
      this.addTokenInteractions(group, hero);
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
      fontSize: Math.max(12, Math.round(this.cellSize / 4.5)),
      fontStyle: 'bold',
      fill: '#fff',
      shadowColor: 'black',
      shadowBlur: 4,
      shadowOffset: { x: 1, y: 1 },
    });
  }

  private addTokenInteractions(group: Konva.Group, hero: BolHerosModel): void {
    group.on('dragend', () => {
      const pos = this.snapToGrid(group.x(), group.y());
      const col = pos.x / this.cellSize;
      const row = pos.y / this.cellSize;

      // Vérification collision
      if (!this.isCellFree(col, row, hero.id)) {
        // remettre l’ancien emplacement si collision
        const previous = this.tokenPositions.get(hero.id);
        if (previous) {
          group.position({
            x: previous.col * this.cellSize,
            y: previous.row * this.cellSize,
          });
        }
        this.tokenLayer.draw();
        return;
      }

      // Si libre → enregistrer
      group.position(pos);
      this.tokenPositions.set(hero.id, { col, row });
      localStorage.setItem('battlemap_positions', JSON.stringify([...this.tokenPositions]));
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
    group.on('dblclick dbltap', (e) => {
      this.tokenDoubleClick.emit(hero);
      e.cancelBubble = true;
    });
    group.on('contextmenu', (e) => {
      e.cancelBubble = true;
      e.evt.preventDefault();
      this.contextMenu.emit({event: e.evt, hero: hero});
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

    const currentCol = this.selectedToken.x() / this.cellSize;
    const currentRow = this.selectedToken.y() / this.cellSize;

    let newCol = currentCol + dx;
    let newRow = currentRow + dy;

    // ⛔ Empêcher de sortir de la grille
    if (newCol < 0 || newCol >= this.cols) return;
    if (newRow < 0 || newRow >= this.rows) return;

    // Trouver l'id du token actuellement sélectionné
    const heroId = [...this.tokenPositions.entries()].find(([id, p]) =>
      p.col === currentCol && p.row === currentRow
    )?.[0];
    if (!heroId) return;

    // ⛔ Collision ?
    if (!this.isCellFree(newCol, newRow, heroId)) {
      return;
    }

    // ✔ Déplacement autorisé
    this.selectedToken.position({
      x: newCol * this.cellSize,
      y: newRow * this.cellSize,
    });

    // Mettre à jour la map
    this.tokenPositions.set(heroId, { col: newCol, row: newRow });
    localStorage.setItem('battlemap_positions', JSON.stringify([...this.tokenPositions]));

    this.tokenLayer.draw();
  }

  private isCellFree(col: number, row: number, movingHeroId: string | null): boolean {
    for (const [heroId, pos] of this.tokenPositions.entries()) {
      if (heroId !== movingHeroId && pos.col === col && pos.row === row) {
        return false; // collision
      }
    }
    return true;
  }

}
