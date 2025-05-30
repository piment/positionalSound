import React, { forwardRef, useMemo, useRef } from 'react'
import { useGLTF, useHelper } from '@react-three/drei'
import { drumkit } from './drumkitMaterials';
import * as THREE from 'three'

export const Snare = forwardRef((props, ref) => {
  const { nodes, materials } = useGLTF('/drumkit/Snare.glb')
    const metalMat = useMemo(() => drumkit.metalMat.clone(), []);
  const padMat  = useMemo(() => drumkit.padMat.clone(), []);
    const woodMat  = useMemo(() => drumkit.woodMat.clone(), []);


            const lightRef   = useRef()
             useHelper(lightRef, THREE.PointLightHelper, 0.5, 'hotpink')
             
  return (
    <group {...props} dispose={null}>
      <group position={[0.433, 0.636, -0.519]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle021.geometry}
        material={woodMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle021_1.geometry}
           material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle021_2.geometry}
          material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle021_3.geometry}
         material={metalMat}
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
         material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle021_6.geometry}
           material={padMat}
               >

        </mesh>
        <group position={[0, -0.51, 0.0]}>
                 <pointLight
             ref={lightRef}
  color={props.color}      // initial value; ObjSound will overwrite each frame
  intensity={0}     
  scale={.25}

  decay={1}
/>
        </group>
      </group>
    </group>
  )
})

useGLTF.preload('/drumkit/Snare.glb')