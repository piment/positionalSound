import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'

export function Snare(props) {
  const { nodes, materials } = useGLTF('/drumkit/Snare.glb')
  return (
    <group {...props} dispose={null}>
      <group position={[0.433, 0.636, -0.519]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle021.geometry}
          material={nodes.Circle021.material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle021_1.geometry}
          material={nodes.Circle021_1.material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle021_2.geometry}
          material={nodes.Circle021_2.material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle021_3.geometry}
          material={nodes.Circle021_3.material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle021_4.geometry}
          material={nodes.Circle021_4.material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle021_5.geometry}
          material={nodes.Circle021_5.material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle021_6.geometry}
          material={nodes.Circle021_6.material}
        />
      </group>
    </group>
  )
}

useGLTF.preload('/drumkit/Snare.glb')