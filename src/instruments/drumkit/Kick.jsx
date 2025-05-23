import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'

export function Kick(props) {
  const { nodes, materials } = useGLTF('/drumkit/Kick.glb')
  return (
    <group {...props} dispose={null}>
      <group position={[-0.002, 0.294, 0.013]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle053.geometry}
          material={nodes.Circle053.material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle053_1.geometry}
          material={nodes.Circle053_1.material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle053_2.geometry}
          material={nodes.Circle053_2.material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle053_3.geometry}
          material={nodes.Circle053_3.material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle053_4.geometry}
          material={nodes.Circle053_4.material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle053_5.geometry}
          material={nodes.Circle053_5.material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle053_6.geometry}
          material={nodes.Circle053_6.material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle053_7.geometry}
          material={nodes.Circle053_7.material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle053_8.geometry}
          material={nodes.Circle053_8.material}
        />
      </group>
    </group>
  )
}

useGLTF.preload('/drumkit/Kick.glb')