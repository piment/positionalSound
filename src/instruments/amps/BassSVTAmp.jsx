import React, { forwardRef, useMemo, useRef } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
export const  BassSVTAmp= forwardRef((props, ref) => {
  const { nodes, materials } = useGLTF('/amps/bass_svt.glb')
    const lightRef = useRef();
    const [svtCol,svtNorm,svtRough,svtMetal] = useTexture([
      '/amps/textures/Comb_Comb_BaseColor.png',
      '/amps/textures/Comb_Comb_Normal.png',
      '/amps/textures/Comb_Comb_Roughness.png',
      '/amps/textures/Comb_Comb_Metallic.png',
    ])

    svtCol.flipY = svtNorm.flipY = svtRough.flipY = svtMetal.flipY = false

    const svtMat =new THREE.MeshStandardMaterial({map : svtCol, normalMap: svtNorm, roughnessMap: svtRough, metalnessMap: svtMetal,})
   
  return (
    <group    {...props}
      dispose={null}
      rotation={[0, -Math.PI *.72, 0]}
      position={[-2, 0, 6]}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.CombUp001.geometry}
        material={svtMat}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.CombDown001.geometry}
        material={svtMat}
      />
            <group position={[-.74,.6,0.24483]}>
        <pointLight
          ref={lightRef}
          color={props.color} // initial value; ObjSound will overwrite each frame
          intensity={0}
          userData={{ intensityMultiplier: 4 }} 
          // scale={.15}
          // distance={120.5}
          castShadow
          decay={.8}
          // shadow-bias={-0.001}
          // shadow-mapSize-width={1024}
          // shadow-mapSize-height={1024}
          // shadow-radius={1}
          // shadow-camera-near={0.5} // move the near clipping plane
          // shadow-camera-far={60}
          // shadow-blurSamples={12}
        />
      </group>
    </group>
  )
})

useGLTF.preload('/amps/bass_svt.glb')
