import { CameraShake, Environment, MeshReflectorMaterial, Sparkles } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import * as THREE from 'three'
function EnvComp({playing}) {
  const mode     = useSelector(state => state.viewMode)

const floorRef = useRef()
  const lightRef = useRef()
  // This will hold 0 or 1 depending on whether we want it dark or bright.
  const [target, setTarget] = useState(() => (playing ? 0 : 1))

  // Whenever `playing` changes:
  useEffect(() => {
    if (playing) {
      // Immediately snap intensity to 0 when playback starts
      if (lightRef.current) {
        lightRef.current.intensity = 0
      }
      // Also keep target at 0 (so it stays dark while playing).
      setTarget(0)
    } else {
      // When playback stops, set the target to 1 (we’ll lerp up to 1).
      setTarget(4)
    }
  }, [playing])

  // Every frame, lerp the actual intensity toward `target`:
  useFrame((_, delta) => {
    if (!lightRef.current) return
    // current intensity
    const cur = lightRef.current.intensity
    // lerp: new = cur + (target - cur) * (speed * delta)
    // here “2” is just a speed factor—tweak to make the fade faster/slower.
    const next = THREE.MathUtils.lerp(cur, target, delta * 2)
    lightRef.current.intensity = next
  })

  return (
    <>
    <directionalLight
      ref={lightRef}
      // Start initially at either 0 or 1 depending on playing
      intensity={playing ? 0 : 1}
      color={0xffffff}
    />
   <mesh ref={floorRef} rotation={[-Math.PI*0.5,0,0]} position={[0,0,0]} castShadow  receiveShadow>
    <planeGeometry args={[100,100]} />
    {/* {mode === 'stageMode' ?
    <MeshReflectorMaterial blur={[0, 0]} // Blur ground reflections (width, height), 0 skips blur
    mixBlur={0.4} // How much blur mixes with surface roughness (default = 1)
    mixStrength={1} // Strength of the reflections
    mixContrast={1} // Contrast of the reflections
    resolution={1024} // Off-buffer resolution, lower=faster, higher=better quality, slower
    mirror={.81} // Mirror environment, 0 = texture colors, 1 = pick up env colors
    depthScale={3} // Scale the depth factor (0 = no depth, default = 0)
    minDepthThreshold={0.9} // Lower edge for the depthTexture interpolation (default = 0)
    maxDepthThreshold={1} // Upper edge for the depthTexture interpolation (default = 0)
    depthToBlurRatioBias={0.25} // Adds a bias factor to the depthTexture before calculating the blur amount [blurFactor = blurTexture * (depthTexture + bias)]. It accepts values between 0 and 1, default is 0.25. An amount > 0 of bias makes sure that the blurTexture is not too sharp because of the multiplication with the depthTexture
    distortion={1}
    envMapIntensity={0}
    />
    
   :  
  } */}
  <meshStandardMaterial color={"#050505"} roughness={.81} metalness={.1 } shadowSide={THREE.DoubleSide}/>
   </mesh>
{/* <Environment files='adamsbridge.hdr' /> */}
   </>
  )
}

export default EnvComp