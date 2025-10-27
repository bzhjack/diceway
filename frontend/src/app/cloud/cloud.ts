import {Component, ElementRef, ViewChild} from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-cloud',
  imports: [],
  templateUrl: './cloud.html',
  styleUrl: './cloud.scss',
})
export class Cloud {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer!: THREE.WebGLRenderer;
  private camera!: THREE.OrthographicCamera;
  private scene!: THREE.Scene;
  private material!: THREE.ShaderMaterial;
  private plane!: THREE.Mesh;
  private animationId!: number;
  private startTime = Date.now();

  ngAfterViewInit(): void {
    this.initScene();
    this.animate();
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }

  private initScene(): void {
    const canvas = this.canvasRef.nativeElement;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 10);
    this.camera.position.z = 1;
    this.scene = new THREE.Scene();

    const geometry = new THREE.PlaneGeometry(2 * aspect, 2);

    // 🧟‍♂️ Shader "Creepy Fog"
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0 },
        u_color1: { value: new THREE.Color(0x0a0a0a) }, // noir profond
        u_color2: { value: new THREE.Color(0x1a2a1a) }, // vert sombre
        u_intensity: { value: 0.5 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float u_time;
        uniform vec3 u_color1;
        uniform vec3 u_color2;
        uniform float u_intensity;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
            mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x),
            u.y
          );
        }

        void main() {
          vec2 uv = vUv * 3.0;
          float t = u_time * 0.03;

          // Plusieurs couches de bruit pour texture "vivante"
          float n = 0.0;
          n += 0.7 * noise(uv + t);
          n += 0.4 * noise(uv * 2.0 - t * 0.8);
          n += 0.2 * noise(uv * 4.0 + t * 0.5);
          n = n / 1.3;

          // Simule un effet de respiration lente (pulsation du brouillard)
          float pulse = sin(u_time * 0.2) * 0.5 + 0.5;
          n = mix(n, n * pulse, 0.4);

          // Mélange de couleurs glauques
          vec3 base = mix(u_color1, u_color2, n);
          float vignette = smoothstep(1.0, 0.4, length(vUv - 0.5));
          base *= vignette;

          // Ajout d’un léger scintillement sinistre
          float flicker = sin(u_time * 2.0 + n * 20.0) * 0.1;
          base += vec3(flicker * 0.2, flicker * 0.1, 0.0);

          gl_FragColor = vec4(base, 1.0);
        }
      `,
    });

    this.plane = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.plane);
  }

  private animate = () => {
    const elapsed = (Date.now() - this.startTime) * 0.001;
    (this.material.uniforms['u_time'] as { value: number }).value = elapsed;

    this.renderer.render(this.scene, this.camera);
    this.animationId = requestAnimationFrame(this.animate);
  };

  private onResize = () => {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera.left = -aspect;
    this.camera.right = aspect;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };
}
