import React, { useMemo, useRef } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
export function BassAmp(props) {
  const { nodes, materials } = useGLTF('/amps/bass_amp.glb')

const [cabCol, cabNorm, cabMet, cabRough, headCol,headMet,headRough] = useTexture([
  '/amps/textures/FenderAmpCabinet_Base_color.png',
'/amps/textures/FenderAmpCabinet_Metallic.png',
'/amps/textures/FenderAmpCabinet_Norm_2kcomp.png',
'/amps/textures/FenderAmpCabinet_Roughness.png',
'/amps/textures/FenderAmpHead_Base_color.png',
'/amps/textures/FenderAmpHead_Metallic.png',
'/amps/textures/FenderAmpHead_Roughness.png',])


const textures = [cabCol, cabNorm, cabMet, cabRough, headCol,headMet,headRough]
textures.forEach(tex => {
          tex.flipY = false;
          tex.needsUpdate = true; // ensure the change takes effect
        });

  const ampHeadMat = useMemo(() => new THREE.MeshPhongMaterial({map: headCol, metalness: .8, metalnessMap: headMet, roughnessMap: headRough, roughness: .1, envMapIntensity: 0}),[])
    const ampCabMat = useMemo(() => new THREE.MeshPhongMaterial({map: cabCol,  metalnessMap: cabMet, roughnessMap: cabRough , envMapIntensity: 0}),[])
  return (
    <group {...props} dispose={null} rotation={[0,-Math.PI*1.2,0]}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cab.geometry}
        material={ampCabMat}
  position={[0, 0.434, -0.011]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Head.geometry}
        material={ampHeadMat}
      //  position={[0.001, 0.894, 0.039]}
      />
    </group>
  )
}

useGLTF.preload('/amps/bass_amp.glb')
