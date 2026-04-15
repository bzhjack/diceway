import { Directive, HostBinding, HostListener, input, output } from '@angular/core';

@Directive({
  selector: '[dwDragDropFile]',
})
export class DragDropFileDirective {
  readonly dropDisabled = input(false);
  readonly filesDropped = output<File[]>();

  @HostBinding('class.drag-over')
  protected dragOverClass?: string;

  @HostListener('dragover', ['$event'])
  protected dragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverClass = this.dropDisabled() ? undefined : 'drag-over';
  }

  @HostListener('dragleave', ['$event'])
  protected dragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverClass = undefined;
  }

  @HostListener('drop', ['$event'])
  protected drop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverClass = undefined;
    if (this.dropDisabled()) {
      return;
    }

    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.filesDropped.emit(Array.from(files));
    }
  }
}
