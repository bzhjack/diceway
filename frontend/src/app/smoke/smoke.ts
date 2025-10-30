import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import {ParticleGeometryGenerator, ParticleMaterialGenerator, SmokeProps} from './smoke.model';
import { getDefaultParticleGeometryGenerator, getDefaultParticleMaterialGenerator } from './particle.utils';

@Component({
  selector: 'app-smoke',
  templateUrl: './smoke.html',
  styleUrls: ['./smoke.scss']
})
export class Smoke implements OnInit, OnDestroy {
  @Input() enableFrustumCulling: boolean = true;
  @Input() turbulenceStrength: [number, number, number] = [0.01, 0.01, 0.01];
  @Input() enableTurbulence: boolean = false;
  @Input() maxVelocity: [number, number, number] = [30, 30, 0];
  @Input() velocityResetFactor: number = 10;
  @Input() minBounds: [number, number, number] = [-800, -800, -800];
  @Input() maxBounds: [number, number, number] = [800, 800, 800];
  @Input() opacity: number = 0.5;
  @Input() color: THREE.Color = new THREE.Color(0xffffff);
  @Input() density: number = 50;
  @Input() size: [number, number, number] = [1000, 1000, 1000];
  @Input() castShadow: boolean = false;
  @Input() receiveShadow: boolean = false;
  @Input() windStrength: [number, number, number] = [0.01, 0.01, 0.01];
  @Input() windDirection: [number, number, number] = [1, 0, 0];
  @Input() enableWind: boolean = false;
  @Input() enableRotation: boolean = false;
  @Input() rotation: [number, number, number] = [0, 0, 0.1];
  @Input() textures: string[] = ['assets/smoke-default.png'];
  @Input() particleGeometry: ParticleGeometryGenerator = getDefaultParticleGeometryGenerator();
  @Input() particleMaterial: ParticleMaterialGenerator = getDefaultParticleMaterialGenerator();

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private particles: THREE.Mesh[] = [];
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];
  private textureVariants: THREE.Texture[] = [];
  private frustum: THREE.Frustum = new THREE.Frustum();
  private boundingBox: THREE.Box3 = new THREE.Box3();
  private tempVec3: THREE.Vector3 = new THREE.Vector3();
  private animationId: number | undefined;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 6000);
    this.camera.position.set(0, 0, 500);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  ngOnInit(): void {
    this.loadTextures();
    this.initParticles();
    this.animate();
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.cleanup();
  }

  private loadTextures(): void {
    this.textureVariants = this.textures.map(texturePath => {
      const texture = new THREE.TextureLoader().load(texturePath);
      return texture;
    });
  }

  private initParticles(): void {
    this.geometries = Array.from({ length: this.density }, (_, index) =>
      this.particleGeometry(index, { size: this.size, density: this.density })
    );
    this.materials = Array.from({ length: this.density }, (_, index) =>
      this.particleMaterial(index, this.textureVariants, { opacity: this.opacity, density: this.density, color: this.color })
    );
    this.particles = Array.from({ length: this.density }, (_, index) => {
      const particle = new THREE.Mesh(this.geometries[index], this.materials[index]);
      particle.castShadow = this.castShadow;
      particle.receiveShadow = this.receiveShadow;
      this.randomizeParticlePosition(particle);
      this.randomizeParticleVelocity(particle);
      if (this.enableRotation) {
        this.randomizeParticleRotation(particle);
      }
      if (this.enableTurbulence) {
        particle.userData['turbulence'] = new THREE.Vector3(
          Math.random() * 2 * Math.PI,
          Math.random() * 2 * Math.PI,
          Math.random() * 2 * Math.PI
        );
      }
      this.scene.add(particle);
      return particle;
    });
  }

  private randomizeParticlePosition(particle: THREE.Mesh): void {
    particle.position.set(
      Math.random() * (this.maxBounds[0] - this.minBounds[0]) + this.minBounds[0],
      Math.random() * (this.maxBounds[1] - this.minBounds[1]) + this.minBounds[1],
      Math.random() * (this.maxBounds[2] - this.minBounds[2]) + this.minBounds[2]
    );
  }

  private randomizeParticleVelocity(particle: THREE.Mesh): void {
    particle.userData['velocity'] = new THREE.Vector3(
      Math.random() * this.maxVelocity[0] * 2 - this.maxVelocity[0],
      Math.random() * this.maxVelocity[1] * 2 - this.maxVelocity[1],
      Math.random() * this.maxVelocity[2] * 2 - this.maxVelocity[2]
    );
  }

  private randomizeParticleRotation(particle: THREE.Mesh): void {
    const [rx, ry, rz] = this.rotation;
    particle.rotation.set(
      Math.random() * rx * 2 - rx,
      Math.random() * ry * 2 - ry,
      Math.random() * rz * 2 - rz
    );
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());
    this.updateParticles();
    this.renderer.render(this.scene, this.camera);
  }

  private updateParticles(): void {
    if (this.enableFrustumCulling) {
      this.camera.updateMatrixWorld();
      this.frustum.setFromProjectionMatrix(this.camera.projectionMatrix);
    }
    this.particles.forEach(particle => {
      if (!this.enableFrustumCulling || this.frustum.intersectsObject(particle)) {
        const velocity = particle.userData['velocity'];
        const turbulence = particle.userData['turbulence'];
        if (this.enableTurbulence) {
          this.tempVec3.set(
            Math.sin(turbulence.x) * turbulence.length() * this.turbulenceStrength[0],
            Math.sin(turbulence.y) * turbulence.length() * this.turbulenceStrength[1],
            Math.sin(turbulence.z) * turbulence.length() * this.turbulenceStrength[2]
          );
          velocity.add(this.tempVec3);
        }
        if (this.enableWind) {
          velocity.x += this.windDirection[0] * this.windStrength[0];
          velocity.y += this.windDirection[1] * this.windStrength[1];
          velocity.z += this.windDirection[2] * this.windStrength[2];
        }
        velocity.clamp(
          new THREE.Vector3(-this.maxVelocity[0], -this.maxVelocity[1], -this.maxVelocity[2]),
          new THREE.Vector3(this.maxVelocity[0], this.maxVelocity[1], this.maxVelocity[2])
        );
        velocity.z = 0;
        particle.position.add(this.tempVec3.copy(velocity));
        if (this.enableRotation) {
          const [rx, ry, rz] = this.rotation;
          particle.rotation.x += rx * 0.016;
          particle.rotation.y += ry * 0.016;
          particle.rotation.z += rz * 0.016;
        }
        this.checkParticleBounds(particle, velocity, turbulence);
      }
    });
  }

  private checkParticleBounds(particle: THREE.Mesh, velocity: THREE.Vector3, turbulence: THREE.Vector3): void {
    const [minX, minY, minZ] = this.minBounds;
    const [maxX, maxY, maxZ] = this.maxBounds;
    if (
      particle.position.x < minX || particle.position.x > maxX ||
      particle.position.y < minY || particle.position.y > maxY ||
      particle.position.z < minZ || particle.position.z > maxZ
    ) {
      const center = this.tempVec3.set((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
      const targetDirection = center.clone().sub(particle.position).normalize();
      velocity.add(targetDirection.multiplyScalar(this.velocityResetFactor));
      if (turbulence) {
        turbulence.set(
          Math.random() * 2 * Math.PI,
          Math.random() * 2 * Math.PI,
          Math.random() * 2 * Math.PI
        );
      }
    }
  }

  private cleanup(): void {
    this.particles.forEach(particle => {
      this.scene.remove(particle);
      particle.geometry.dispose();
      if (Array.isArray(particle.material)) {
        particle.material.forEach(m => m.dispose());
      } else {
        particle.material.dispose();
      }
    });
  }
}
