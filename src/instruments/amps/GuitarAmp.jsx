
import React, { useMemo, useRef } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
export function GuitarAmp(props) {
  const { nodes, materials } = useGLTF('/amps/marshall_amp.glb')

const [ampCol, ampNorm] = useTexture([
  '/amps/textures/marshall1.png',
 '/amps/textures/marshall_normal.png'])

ampCol.flipY = ampNorm.flipY = false

const ampMat = useMemo(() => new THREE.MeshStandardMaterial({map: ampCol, normalMap: ampNorm, roughness : .8, emissive: ampCol, emissiveIntensity:1, envMapIntensity: .01}))

  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.horni_box.geometry}
        material={ampMat}
        position={[0.001, 0.015, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.hlava.geometry}
        material={ampMat}
        position={[0, 0.792, -0.035]}
      />
    </group>
  )
}

useGLTF.preload('/marshall_amp.glb')
