import * as THREE from 'three';

export const drumkit = {
  metalMat: new THREE.MeshStandardMaterial({ metalness: 1, roughness: 0.1 }),
  padMat:   new THREE.MeshStandardMaterial({ color: '#efe', metalness: 0, roughness: 0.1 }),
  redMat:   new THREE.MeshBasicMaterial({ color: 'red' }),
};