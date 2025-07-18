
import React, { forwardRef, useMemo, useRef } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import { drumkit } from './drumkitMaterials'
import * as THREE from 'three'
export const RideMin = forwardRef((props, ref) => {
  const { nodes, materials } = useGLTF('/drumkit/RideMin.glb')
        const metalMat = useMemo(() => drumkit.metalMat.clone(), []);
        const padMat  = useMemo(() => drumkit.padMat.clone(), []);
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
  return (
    <group {...props} dispose={null} position={[0,0,-3]}>
      <group position={[-0.627, 0.468, -0.242]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle003.geometry}
         material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle003_1.geometry}
       material={padMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle003_2.geometry}
  material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle003_3.geometry}
          material={cymbalMaterial}
        />
      </group>
    </group>
  )
}
)
useGLTF.preload('/drumkit/RideMin.glb')
