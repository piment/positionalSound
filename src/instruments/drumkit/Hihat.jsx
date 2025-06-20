import React, { forwardRef, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { drumkit } from './drumkitMaterials'
export const Hihat = forwardRef((props, ref) => {
  const { nodes, materials } = useGLTF('/drumkit/Hihat.glb')
     const metalMat = useMemo(() => drumkit.metalMat.clone(), []);
  return (
    <group {...props} dispose={null}>
      <group position={[0.63, 0.378, -0.798]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle054.geometry}
          material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle054_1.geometry}
    material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle054_2.geometry}
           material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle054_3.geometry}
     material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle054_4.geometry}
        material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle054_5.geometry}
       material={metalMat}
        />
      </group>
    </group>
  )
})

useGLTF.preload('/drumkit/Hihat.glb')
