import {Directive, EventEmitter, HostBinding, HostListener, Input, Output} from '@angular/core';

@Directive({
  selector: '[dwDragDropFile]',
  standalone: true
})
export class DragDropFileDirective {

  @Input()
  public dropDisabled = false;

  @Output()
  public filesDropped = new EventEmitter<File[]>();

  @HostBinding('class.drag-over')
  public dragOverClass?: string;

  // Dragover Event
  @HostListener('dragover', ['$event'])
  public dragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverClass = this.dropDisabled ? undefined : 'drag-over';
  }

  // Dragleave Event
  @HostListener('dragleave', ['$event'])
  public dragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverClass = undefined;
  }

  // Drop Event
  @HostListener('drop', ['$event'])
  public drop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverClass = undefined;
    if(this.dropDisabled) {
      return;
    }
    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.filesDropped.emit(Array.from(files));
    }
  }

}
