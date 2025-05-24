import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { drumkit } from './drumkitMaterials'
export function Crash(props) {
  const { nodes, materials } = useGLTF('/drumkit/Crash.glb')
        const metalMat = useMemo(() => drumkit.metalMat.clone(), []);

  return (
    <group {...props} dispose={null}>
      <group position={[0.526, 0.478, -0.214]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle044.geometry}
          material={nodes.Circle044.material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle044_1.geometry}
          material={nodes.Circle044_1.material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle044_2.geometry}
          material={nodes.Circle044_2.material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle044_3.geometry}
          material={nodes.Circle044_3.material}
        />
      </group>
    </group>
  )
}

useGLTF.preload('/drumkit/Crash.glb')