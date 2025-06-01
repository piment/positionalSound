import * as THREE from 'three';

export const ampmats = {
  metalMat: new THREE.MeshStandardMaterial({ metalness: 1, roughness: 0.1, name: 'metalMat' }),
  padMat:   new THREE.MeshPhongMaterial({ color: '#c1c1c1', metalness: 0, roughness: 0.1, name: 'padMat', emissive: "#fff", emissiveIntensity: 1 }),
  woodMat : new THREE.MeshStandardMaterial({ color: '#111', metalness: 0, roughness: 0.1}),
};