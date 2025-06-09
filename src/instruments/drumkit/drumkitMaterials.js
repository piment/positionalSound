import { useTexture } from '@react-three/drei';
import * as THREE from 'three';


export const drumkit = {
  // metalMat: new THREE.MeshPhongMaterial({  name: 'metalMat', reflectivity: 1 }),
    metalMat: new THREE.MeshStandardMaterial({  name: 'metalMat', metalness: 1 , roughness: .1  }),
  padMat:   new THREE.MeshPhongMaterial({ color: '#c1c1c1', name: 'padMat', emissive: "#fff", emissiveIntensity: 1 }),
  woodMat : new THREE.MeshStandardMaterial({ color: '#111', metalness: 0, roughness: 0.1}),
  redMat:   new THREE.MeshBasicMaterial({ color: 'red' }),
  plasticMat: new THREE.MeshLambertMaterial({color: "#151515", reflectivity: .7, shininess: 1})
};

