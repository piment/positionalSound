import * as THREE from 'three';

export const drumkit = {
  metalMat: new THREE.MeshPhongMaterial({ metalness: 1, roughness: 0.1, name: 'metalMat', reflectivity: 1 }),
  padMat:   new THREE.MeshPhongMaterial({ color: '#c1c1c1', metalness: 0, roughness: 0.1, name: 'padMat', emissive: "#fff", emissiveIntensity: 1 }),
  woodMat : new THREE.MeshStandardMaterial({ color: '#111', metalness: 0, roughness: 0.1}),
  redMat:   new THREE.MeshBasicMaterial({ color: 'red' }),
};