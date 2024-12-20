import * as THREE from 'three';

export const SCENE_SETTINGS = {
  SKY_COLOR: new THREE.Color(0x87ceeb), // Light sky blue
  GROUND_COLOR: 0x808080,
  SHADOW_SETTINGS: {
    mapSize: 2048,
    camera: {
      near: 0.5,
      far: 500,
    },
  },
  FOG_SETTINGS: {
    color: 0x87ceeb,
    near: 1,
    far: 100,
  },
};
