
import React, { forwardRef, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { drumkit } from './drumkitMaterials'
export const Ride = forwardRef((props, ref) => {
  const { nodes, materials } = useGLTF('/drumkit/Ride.glb')
        const metalMat = useMemo(() => drumkit.metalMat.clone(), []);

  return (
    <group {...props} dispose={null}>
      <group position={[-0.627, 0.468, -0.242]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle023.geometry}
          material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle023_1.geometry}
           material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle023_2.geometry}
           material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle023_3.geometry}
          material={nodes.Circle023_3.material}
        />
      </group>
    </group>
  )
}
)
useGLTF.preload('/drumkit/Ride.glb')
