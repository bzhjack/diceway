import {Directive, input, output, signal} from '@angular/core';

/** Zone de dépôt de fichiers : pose la classe `drag-over` pendant le survol (sauf si le dépôt est désactivé) et émet les fichiers
 * déposés. */
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
  readonly dropDisabled = input(false);
  readonly filesDropped = output<File[]>();

  protected readonly dragOver = signal(false);

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(!this.dropDisabled());
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
    if (this.dropDisabled()) {
      return;
    }

    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.filesDropped.emit(Array.from(files));
    }
  }
}
