import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {ImageCroppedEvent, ImageCropperComponent, ImageTransform} from 'ngx-image-cropper';
import {DragDropFileDirective} from './drag-drop-file.directive';

@Component({
  selector: 'app-picture',
  imports: [MatButtonModule, MatIconModule, MatDialogModule, DragDropFileDirective, ImageCropperComponent],
  templateUrl: './picture.html',
  styleUrl: './picture.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PictureComponent {
  private readonly ref = inject(MatDialogRef<PictureComponent>);
  protected readonly title = inject<{title: string}>(MAT_DIALOG_DATA).title;

  protected imageChangedEvent: any = null;
  protected croppedImage = '';
  protected scale = 1;
  protected transform: ImageTransform = {};

  protected imageCropped(event: ImageCroppedEvent): void {
    this.croppedImage = event.base64 || '';
  }

  protected fileChangeEvent(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (input?.files?.length) {
      this.imageChangedEvent = event;
    }
  }

  protected dropFileEvent(files: File[]): void {
    if (files.length > 0) {
      this.imageChangedEvent = { target: { files } };
    }
  }

  protected loadImageFailed(): void {
    this.imageChangedEvent = null;
    this.croppedImage = '';
  }

  protected zoomOut(): void {
    this.scale -= 0.1;
    this.transform = { ...this.transform, scale: this.scale };
  }

  protected zoomIn(): void {
    this.scale += 0.1;
    this.transform = { ...this.transform, scale: this.scale };
  }

  protected resetImage(): void {
    this.scale = 1;
    this.transform = {};
  }

  protected quit(): void {
    this.ref.close(null);
  }

  protected validate(): void {
    this.ref.close(this.croppedImage);
  }
}
