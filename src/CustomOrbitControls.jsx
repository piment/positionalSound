// CustomOrbitControls.jsx
import React, { useRef } from 'react'
import { extend, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls'

// 1️⃣ Tell R3F about the new JSX element <orbitControls>
extend({ OrbitControls: ThreeOrbitControls })

export function CustomOrbitControls() {
  const controls = useRef()
  const { camera, gl } = useThree()

  // 2️⃣ Every frame, update the controls (for damping, etc)
  useFrame(() => controls.current?.update())

  return (
    <orbitControls
      ref={controls}
      // 📐 which camera & which DOM element to listen to
      args={[camera, gl.domElement]}

      // ▪️ damping
      enableDamping
      dampingFactor={0.1}

      // ▪️ zoom limits
      minDistance={5}
      maxDistance={100}

      // ▪️ vertical rotation clamp (so you can’t go under the floor)
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 2}

      // ▪️ allow pan in screen-space, but we’ll clamp “y” ourselves
      enablePan
      screenSpacePanning
      // (if you only want L/R pan, you can hook a change listener below)

      // ▪️ optional keyboard bindings
      enableKeys
      keyPanSpeed={7}

      // you can override the default arrows here if you like
      // keys={{ LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', BOTTOM: 'ArrowDown' }}
    />
  )
}
