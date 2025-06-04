import React, { forwardRef, useRef } from 'react'
import { useGLTF } from '@react-three/drei'

export const  BassSVTAmp= forwardRef((props, ref) => {
  const { nodes, materials } = useGLTF('/amps/bass_svt.glb')
    const lightRef = useRef();
   
  return (
    <group    {...props}
      dispose={null}
      rotation={[0, -Math.PI *.72, 0]}
      position={[-2, 0, 6]}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.CombUp001.geometry}
        material={nodes.CombUp001.material}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.CombDown001.geometry}
        material={nodes.CombDown001.material}
      />
            <group position={[0,.4,0.483]}>
        <pointLight
          ref={lightRef}
          color={props.color} // initial value; ObjSound will overwrite each frame
          intensity={0}
          userData={{ intensityMultiplier: 2 }} 
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
