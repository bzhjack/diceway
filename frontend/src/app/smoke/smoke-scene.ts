import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { SmokeSceneProps } from './smoke.model';
import {Smoke} from './smoke';

@Component({
  selector: 'app-smoke-scene',
  templateUrl: './smoke-scene.html',
  imports: [
    Smoke
  ],
  styleUrls: ['./smoke-scene.scss']
})
export class SmokeScene implements AfterViewInit, OnDestroy {
  @Input() smoke: SmokeSceneProps['smoke'];
  @Input() disableDefaultLights: boolean = false;
  @ViewChild('container') containerRef: ElementRef | undefined;

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('black');
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 6000);
    this.camera.position.set(0, 0, 500);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  ngAfterViewInit(): void {
    this.containerRef!.nativeElement.appendChild(this.renderer.domElement);
    if (!this.disableDefaultLights) {
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(-1, 0, 1);
      this.scene.add(directionalLight);
      this.scene.add(new THREE.AmbientLight(0xffffff, 1));
    }
    this.animate();
  }

  ngOnDestroy(): void {
    this.containerRef!.nativeElement.removeChild(this.renderer.domElement);
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }
}
