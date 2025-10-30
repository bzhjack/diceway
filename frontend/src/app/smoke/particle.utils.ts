import * as THREE from 'three';
import { ParticleGeometryGenerator, ParticleMaterialGenerator, SmokeProps } from './smoke.model';

export const getDefaultParticleGeometryGenerator = (): ParticleGeometryGenerator => {
  let geometry: THREE.PlaneGeometry;
  return (_, { size }) => {
    if (!geometry) {
      geometry = new THREE.PlaneGeometry(size[0], size[1]);
    }
    return geometry;
  };
};

export const getDefaultParticleMaterialGenerator = (): ParticleMaterialGenerator => {
  let materials: THREE.MeshLambertMaterial[];
  return (index, textures, { opacity, color }) => {
    if (!materials) {
      materials = textures.map(texture =>
        new THREE.MeshLambertMaterial({
          map: texture,
          transparent: true,
          opacity: opacity,
          depthWrite: false,
          color: color,
          polygonOffset: true,
          polygonOffsetFactor: 1,
          polygonOffsetUnits: 1,
        })
      );
    }
    return materials[index % materials.length];
  };
};

export const getMultiColorParticleMaterialGenerator = (
  colors: [THREE.Color, THREE.Color, ...THREE.Color[]],
  sizeDeterminant: 'colors' | 'textures' | 'density' = 'colors'
): ParticleMaterialGenerator => {
  let materials: THREE.MeshLambertMaterial[];
  return (index, textures, { opacity, density, color }) => {
    if (!materials) {
      materials = [];
      const commonProps = {
        transparent: true,
        opacity: opacity,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      };
      const length = sizeDeterminant === 'textures' ? textures.length :
        sizeDeterminant === 'colors' ? colors.length : density;
      for (let i = 0; i < length; i++) {
        materials.push(
          new THREE.MeshLambertMaterial({
            map: textures[i % textures.length],
            color: colors[i % colors.length],
            ...commonProps,
          })
        );
      }
    }
    return materials[index % materials.length];
  };
};
