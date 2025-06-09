import React, { forwardRef, useMemo, useRef } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import { drumkit } from './drumkitMaterials';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
export const HihatMin = forwardRef((props, ref) => {
  const { nodes, materials } = useGLTF('/drumkit/HihatMin.glb');

  const [cymEmissiveMap, cymNormalMap] = useTexture([
    '/drumkit/textures/cym_EmissiveMap.png',
    '/drumkit/textures/cym_normals.png',
  ]);
  const cymbalMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#e8cc95', // a base diffuse color
      metalness: 1,
      roughness: 0.5,
      normalMap: cymNormalMap || null,
      emissive: new THREE.Color(0xe8cc95),
      emissiveMap: cymEmissiveMap || null,
      emissiveIntensity: 0,
      name: 'cymbalMat'
    });
  }, [cymNormalMap, cymEmissiveMap]);
  const metalMat = useMemo(() => drumkit.metalMat.clone(), []);
  const padMat  = useMemo(() => drumkit.padMat.clone(), []);
  return (
    <group {...props} dispose={null} position={[0, 0, -3]}>
      <group position={[0.63, 0.378, -0.798]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle001.geometry}
          material={metalMat}
        />
        <mesh
          // visible={false}
          castShadow
          receiveShadow
          geometry={nodes.Circle001_1.geometry}
          //  material={cymMat}
          material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle001_2.geometry}
          material={cymbalMaterial}
          // material-color={'red'}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle001_3.geometry}
          material={metalMat}
        />
      </group>
    </group>
  );
});

useGLTF.preload('/drumkit/HihatMin.glb');
