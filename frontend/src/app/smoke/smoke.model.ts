import * as THREE from 'three';

export type ThreeAxisValue = [x: number, y: number, z: number];

export type ParticleGeometryGenerator = (
  index: number,
  props: Required<Pick<SmokeProps, 'size' | 'density'>>
) => THREE.BufferGeometry;

export type ParticleMaterialGenerator = (
  index: number,
  textures: THREE.Texture[],
  props: Required<Pick<SmokeProps, 'opacity' | 'density' | 'color'>>
) => THREE.Material;

export interface SmokeProps {
  enableFrustumCulling?: boolean;
  turbulenceStrength?: ThreeAxisValue;
  enableTurbulence?: boolean;
  maxVelocity?: ThreeAxisValue;
  velocityResetFactor?: number;
  minBounds?: ThreeAxisValue;
  maxBounds?: ThreeAxisValue;
  opacity?: number;
  color?: THREE.Color;
  density?: number;
  size?: ThreeAxisValue;
  castShadow?: boolean;
  receiveShadow?: boolean;
  windStrength?: ThreeAxisValue;
  windDirection?: ThreeAxisValue;
  enableWind?: boolean;
  enableRotation?: boolean;
  rotation?: ThreeAxisValue;
  textures?: [string, ...string[]];
  particleGeometry?: ParticleGeometryGenerator;
  particleMaterial?: ParticleMaterialGenerator;
}

export interface SmokeSceneProps {
  smoke?: SmokeProps;
  disableDefaultLights?: boolean;
  ambientLightProps?: THREE.Light;
  directionalLightProps?: THREE.Light;
}
