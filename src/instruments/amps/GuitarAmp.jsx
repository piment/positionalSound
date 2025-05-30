
import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'

export function GuitarAmp(props) {
  const { nodes, materials } = useGLTF('/marshall_amp.glb')
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.horni_box.geometry}
        material={nodes.horni_box.material}
        position={[0.001, 0.015, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.hlava.geometry}
        material={nodes.hlava.material}
        position={[0, 0.792, -0.035]}
      />
    </group>
  )
}

useGLTF.preload('/marshall_amp.glb')
