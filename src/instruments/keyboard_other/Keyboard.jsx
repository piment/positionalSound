import React, { forwardRef, useMemo, useRef } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
export const Keyboard= forwardRef((props, ref) => {
  const { nodes, materials } = useGLTF('/mics_keys/keyboard_stand.glb')

  const keyboardCol = useTexture('/mics_keys/textures/keyboard_graphics.png')
  keyboardCol.flipY = false
const whiteKeysMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c1c1c1',name: 'whiteKeysMat' ,emissive: "#fff", emissiveIntensity: 0 }))
const blackKeysMat = useMemo(() => new THREE.MeshPhongMaterial({shininess: 1}),[])
const keyboardMat = useMemo(() => new THREE.MeshStandardMaterial({color: "#151515"}),[])
  return (
    <group {...props} dispose={null} position={[-4,0,1]}>
      <mesh
//  Stand
        castShadow
        receiveShadow
        geometry={nodes.Stand001.geometry}
        material={blackKeysMat}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Fader_1.geometry}
        material={nodes.Fader_1.material}
      />
      <mesh
      
      //White keys
        castShadow
        receiveShadow
        geometry={nodes.Plane002.geometry}
        material={whiteKeysMat}
        // material-color={props.color? props.color : 'white'}
      />
      <mesh
      
        castShadow
        receiveShadow
        geometry={nodes.Plane002_1.geometry}
      material={keyboardMat}
      />
      <mesh
      
        castShadow
        receiveShadow
        geometry={nodes.Plane002_2.geometry}
        material={nodes.Plane002_2.material}
      />
      <mesh
      //black keys
        castShadow
        receiveShadow
        geometry={nodes.Plane002_3.geometry}
        material={blackKeysMat}
        material-color={"black"}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane002_4.geometry}
        material={keyboardMat}
      />
    </group>
  )
})

useGLTF.preload('/mics/keyboard_stand.glb')