import {Injectable} from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BattlemapUtils {

  /** Ajuste les coordonnées x,y pour qu'elles restent sur la grille */
  snapToGrid(x: number, y: number, cellSize: number, maxX: number, maxY: number) {
    const gx = Math.max(0, Math.min(maxX, Math.round(x / cellSize) * cellSize));
    const gy = Math.max(0, Math.min(maxY, Math.round(y / cellSize) * cellSize));
    return { x: gx, y: gy };
  }

  /** Vérifie si une case est déjà occupée */
  isCellOccupied(
    positions: Map<string, { col: number; row: number }>,
    heroId: string,
    col: number,
    row: number
  ): boolean {
    return [...positions.entries()].some(([id, p]) => id !== heroId && p.col === col && p.row === row);
  }

  /** Clamp toutes les positions pour qu'elles restent dans la grille */
  clampPositions(
    positions: Map<string | null, { col: number; row: number }>,
    maxCol: number,
    maxRow: number
  ): { updatedPositions: Map<string | null, { col: number; row: number }>, changed: boolean } {
    const updatedPositions = new Map(positions);
    let changed = false;
    positions.forEach((pos, id) => {
      let col = Math.min(maxCol, Math.max(0, pos.col));
      let row = Math.min(maxRow, Math.max(0, pos.row));
      if (col !== pos.col || row !== pos.row) {
        updatedPositions.set(id, { col, row });
        changed = true;
      }
    });
    return { updatedPositions, changed };
  }

  /** Génère une position par défaut sur la grille selon l'index */
  defaultTokenPosition(index: number, cols: number): { col: number, row: number } {
    return { col: index % cols, row: Math.floor(index / cols) };
  }
}
