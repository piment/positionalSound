
import React, { forwardRef, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { drumkit } from './drumkitMaterials'
export const HiTom = forwardRef((props, ref) => {
  const { nodes, materials } = useGLTF('/drumkit/Tom2.glb')
        const metalMat = useMemo(() => drumkit.metalMat.clone(), []);
      const padMat  = useMemo(() => drumkit.padMat.clone(), []);
        const woodMat  = useMemo(() => drumkit.woodMat.clone(), []);
  return (
    <group {...props} dispose={null}>
      <group position={[0.139, 0.831, -0.287]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle005.geometry}
          material={woodMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle005_1.geometry}
           material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle005_2.geometry}
         material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle005_3.geometry}
            material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle005_4.geometry}
              material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle005_5.geometry}
          material={padMat}
        />
      </group>
    </group>
  )
})

useGLTF.preload('/drumkit/Tom2.glb')



