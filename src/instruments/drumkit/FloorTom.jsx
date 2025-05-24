import React, { useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { drumkit } from './drumkitMaterials'
export function FloorTom(props) {
  const { nodes, materials } = useGLTF('/drumkit/TomFloor.glb')
        const metalMat = useMemo(() => drumkit.metalMat.clone(), []);
      const padMat  = useMemo(() => drumkit.padMat.clone(), []);
        const woodMat  = useMemo(() => drumkit.woodMat.clone(), []);
  return (
    <group {...props} dispose={null}>
      <group position={[-0.497, 0.463, -0.578]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle029.geometry}
          material={woodMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle029_1.geometry}
              material={metalMat}
              />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle029_2.geometry}
          material={metalMat}
          scale={1.005}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle029_3.geometry}
    material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle029_4.geometry}
         material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle029_5.geometry}
      material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle029_6.geometry}
          material={padMat}
     
        />
      </group>
    </group>
  )
}

useGLTF.preload('/drumkit/TomFloor.glb')