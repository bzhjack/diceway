import {Component, OnDestroy} from '@angular/core';
import {ButtonModule} from "primeng/button";
import {AutoFocusModule} from "primeng/autofocus";
import {ImageCroppedEvent, ImageCropperModule, ImageTransform} from "ngx-image-cropper";
import {NgIf} from "@angular/common";
import {DomSanitizer} from "@angular/platform-browser";
import {ToolbarModule} from "primeng/toolbar";
import {PanelModule} from "primeng/panel";
import { TooltipModule } from 'primeng/tooltip';
import {DynamicDialogRef} from "primeng/dynamicdialog";

@Component({
  selector: 'app-picture',
  standalone: true,
  imports: [
    ButtonModule,
    AutoFocusModule,
    ImageCropperModule,
    NgIf,
    ToolbarModule,
    PanelModule,
    TooltipModule
  ],
  templateUrl: './picture.component.html',
  styleUrl: './picture.component.scss'
})
export class PictureComponent {
  imageChangedEvent: any = '';
  croppedImage: any = '';
  rotation = 0;
  scale = 1;
  transform: ImageTransform = {};

  constructor(
    public ref: DynamicDialogRef,
    private sanitizer: DomSanitizer
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
    this.ref.close();
  }
  validate() {
    this.ref.close(this.croppedImage);
  }
}
