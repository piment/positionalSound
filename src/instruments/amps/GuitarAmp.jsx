
import React, { useMemo, useRef } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
export function GuitarAmp(props) {
  const { nodes, materials } = useGLTF('/amps/marshall_amp.glb')
 const lightRef = useRef();
const [ampCol, ampNorm] = useTexture([
  '/amps/textures/marshall1.png',
 '/amps/textures/marshall_normal.png'])

ampCol.flipY = ampNorm.flipY = false

const ampMat = useMemo(() => new THREE.MeshStandardMaterial({map: ampCol, normalMap: ampNorm, roughness : 0.5  }))

  return (
    <group {...props} dispose={null} rotation={[0,-Math.PI*.7,0]}      position={[4, 0, 6]}>
          <group position={[-.15,.3,0.583]}>
        <pointLight
          ref={lightRef}
          color={props.color} // initial value; ObjSound will overwrite each frame
          intensity={0}
          userData={{ intensityMultiplier: 2 }} 
          // scale={.15}
          // distance={120.5}
          castShadow
          decay={1}
          // shadow-bias={-0.001}
          // shadow-mapSize-width={1024}
          // shadow-mapSize-height={1024}
          // shadow-radius={1}
          // shadow-camera-near={0.5} // move the near clipping plane
          // shadow-camera-far={60}
          // shadow-blurSamples={12}
        />
      </group>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.horni_box.geometry}
        material={ampMat}
        position={[0.001, 0.005, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.hlava.geometry}
        material={ampMat}
        position={[0, 0.782, -0.035]}
      />
    </group>
  )
}

useGLTF.preload('/marshall_amp.glb')
