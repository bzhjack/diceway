import {Directive, output, signal} from '@angular/core';

/** Zone de dépôt de fichiers : pose la classe `drag-over` pendant le survol et émet les fichiers déposés. */
@Directive({
  selector: '[dwDragDropFile]',
  host: {
    '[class.drag-over]': 'dragOver()',
    '(dragover)': 'onDragOver($event)',
    '(dragleave)': 'onDragLeave($event)',
    '(drop)': 'onDrop($event)',
  },
})
export class DragDropFileDirective {
  readonly filesDropped = output<File[]>();

  protected readonly dragOver = signal(false);

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.filesDropped.emit(Array.from(files));
    }
  }
}
