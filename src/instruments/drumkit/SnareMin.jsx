import React, { forwardRef, useMemo, useRef } from 'react'
import { useGLTF, useHelper } from '@react-three/drei'
import { drumkit } from './drumkitMaterials';
import * as THREE from 'three'

export const Snare = forwardRef((props, ref) => {
  const { nodes, materials } = useGLTF('/drumkit/SnareMin.glb')
    const metalMat = useMemo(() => drumkit.metalMat.clone(), []);
  const padMat  = useMemo(() => drumkit.padMat.clone(), []);
    const woodMat  = useMemo(() => drumkit.woodMat.clone(), []);


            const lightRef   = useRef()
            //  useHelper(lightRef, THREE.PointLightHelper, 0.5, 'hotpink')
             
  return (
    <group {...props} dispose={null} position={[0,0,-3]}>
      <group position={[0.433, 0.63, -0.519]}>
      <group {...props} dispose={null}>
      <mesh
      //gum
        castShadow
        receiveShadow
        geometry={nodes.snare001.geometry}
        material={woodMat}
    
        // material-color={"red"}
       
      />
      <group>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle002.geometry}
          material={woodMat}
          
          // material-color={"black"}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle002_1.geometry}
          material={padMat}
          
          // material-color={"red"}
        />
      </group>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.snare003.geometry}
        material={metalMat}
        
   
      />
    </group>


        {/* <group position={[0, -0.45, 0.0]}>
                 <pointLight
             ref={lightRef}
  color={props.color}      // initial value; ObjSound will overwrite each frame
  intensity={0}     
  scale={.25}
castShadow
  decay={1.5}
  shadow-bias={-0.00008} 
       shadow-mapSize-width={512}
        shadow-mapSize-height={512}
          shadow-radius={4}
            shadow-camera-near={0.05}    // move the near clipping plane
  shadow-camera-far={50} 
/>
        </group> */}
      </group>
    </group>
  )
})

useGLTF.preload('/drumkit/SnareMin.glb')