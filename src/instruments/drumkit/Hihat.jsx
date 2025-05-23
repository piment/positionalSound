import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'

export function Hihat(props) {
  const { nodes, materials } = useGLTF('/drumkit/Hihat.glb')
  return (
    <group {...props} dispose={null}>
      <group position={[0.63, 0.386, -0.798]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle054.geometry}
          material={nodes.Circle054.material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle054_1.geometry}
          material={nodes.Circle054_1.material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle054_2.geometry}
          material={nodes.Circle054_2.material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle054_3.geometry}
          material={nodes.Circle054_3.material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle054_4.geometry}
          material={nodes.Circle054_4.material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle054_5.geometry}
          material={nodes.Circle054_5.material}
        />
      </group>
    </group>
  )
}

useGLTF.preload('/drumkit/Hihat.glb')
