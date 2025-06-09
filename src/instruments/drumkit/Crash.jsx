import React, { forwardRef, useMemo, useRef } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import { drumkit } from './drumkitMaterials'
import * as THREE from 'three'
export const Crash = forwardRef((props, ref) => {
  const { nodes, materials } = useGLTF('/drumkit/Crash.glb')
        const metalMat = useMemo(() => drumkit.metalMat.clone(), []);
  const [cymEmissiveMap, cymNormalMap] = useTexture([
    '/drumkit/textures/cym_EmissiveMap.png',
    '/drumkit/textures/cym_normals.png',
  ]);
  useMemo(() => {
    if (cymNormalMap) {
      cymNormalMap.flipY = false;
      cymNormalMap.encoding = THREE.LinearEncoding;
    }
    if (cymEmissiveMap) {
      cymEmissiveMap.encoding = THREE.sRGBEncoding;
    }
  }, [cymNormalMap, cymEmissiveMap]);
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
  return (
    <group {...props} dispose={null} position={[0,0,-3]}>
      <group position={[0.526, 0.475, -0.214]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle044.geometry}
         material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle044_1.geometry}
          material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle044_2.geometry}
         material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle044_3.geometry}
          material={cymbalMaterial}
        />
      </group>
    </group>
  )
})

useGLTF.preload('/drumkit/Crash.glb')