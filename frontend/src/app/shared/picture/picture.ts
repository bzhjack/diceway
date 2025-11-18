import {Component} from '@angular/core';
import {ButtonModule} from "primeng/button";
import {AutoFocusModule} from "primeng/autofocus";
import {ImageCroppedEvent, ImageCropperComponent, ImageTransform} from "ngx-image-cropper";
import {ToolbarModule} from "primeng/toolbar";
import {PanelModule} from "primeng/panel";
import {TooltipModule} from 'primeng/tooltip';
import {DynamicDialogRef} from "primeng/dynamicdialog";
import {DragDropFileDirective} from "./drag-drop-file.directive";

@Component({
    selector: 'app-picture',
  imports: [
    DragDropFileDirective,
    ButtonModule,
    AutoFocusModule,
    ToolbarModule,
    PanelModule,
    TooltipModule,
    ImageCropperComponent
  ],
    templateUrl: './picture.html',
    styleUrl: './picture.scss'
})
export class Picture {
  imageChangedEvent: any = '';
  croppedImage: any = '';
  rotation = 0;
  scale = 1;
  transform: ImageTransform = {};

  constructor(
    public ref: DynamicDialogRef,
  ) {
  }


  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.base64 || '';
  }

  fileChangeEvent(event: any): void {
    if (event.target.files && event.target.files.length) {
      this.imageChangedEvent = event;
    }
  }

  dropFileEvent(files: any[]): void {
    if (files && files.length > 0) {
      this.imageChangedEvent = {target: {files: files}};
    }
  }

  loadImageFailed() {
    console.log('error');
  }

  zoomOut() {
    this.scale -= .1;
    this.transform = {
      ...this.transform,
      scale: this.scale
    };
  }

  zoomIn() {
    this.scale += .1;
    this.transform = {
      ...this.transform,
      scale: this.scale
    };
  }

  resetImage() {
    this.scale = 1;
    this.rotation = 0;
    this.transform = {};
  }

  quit() {
    this.ref.close(null);
  }

  validate() {
    this.ref.close(this.croppedImage);
  }
}
