import React, { forwardRef, useMemo, useRef } from 'react'
import { useGLTF, useHelper } from '@react-three/drei'
import { drumkit } from './drumkitMaterials'
import * as THREE from 'three'
export const Kick = forwardRef((props, ref) => {
  const { nodes, materials } = useGLTF('/drumkit/Kick.glb')
      const metalMat = useMemo(() => drumkit.metalMat.clone(), []);
    const padMat  = useMemo(() => drumkit.padMat.clone(), []);
      const woodMat  = useMemo(() => drumkit.woodMat.clone(), []);

        const lightRef   = useRef()
        //  useHelper(lightRef, THREE.PointLightHelper, 0.5, 'hotpink')
  return (
    <group {...props} dispose={null} position={[0,0,-3]}>
      <group position={[-0.002, 0.294, 0.013]}>
        <mesh
          castShadow
          // receiveShadow
          geometry={nodes.Circle053.geometry}
          material={padMat}
        >

        </mesh>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle053_1.geometry}
        material={padMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle053_2.geometry}
          //  material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle053_3.geometry}
          material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle053_4.geometry}
          material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle053_5.geometry}
         material={metalMat}
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
          material={woodMat}
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
})

useGLTF.preload('/drumkit/Kick.glb')