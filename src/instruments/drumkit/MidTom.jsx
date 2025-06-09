import React, { forwardRef, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { drumkit } from './drumkitMaterials'
export const MidTom = forwardRef((props, ref) => {
  const { nodes, materials } = useGLTF('/drumkit/Tom3.glb')
        const metalMat = useMemo(() => drumkit.metalMat.clone(), []);
      const padMat  = useMemo(() => drumkit.padMat.clone(), []);
        const woodMat  = useMemo(() => drumkit.woodMat.clone(), []);
  return (
    <group {...props} dispose={null} position={[0,0,-3]}>
      <group position={[-0.172, 0.741, -0.269]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle015.geometry}
          material={woodMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle015_1.geometry}
             material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle015_2.geometry}
             material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle015_3.geometry}
             material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle015_4.geometry}
     material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle015_5.geometry}
          material={padMat}
        />
      </group>
    </group>
  )
}
)
useGLTF.preload('/drumkit/Tom3.glb')
