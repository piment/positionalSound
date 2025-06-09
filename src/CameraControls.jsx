import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import * as THREE from 'three'

const SPEED = 10    // units per second


// these persist across frames so we don’t re-allocate
const frontVector = new THREE.Vector3()
const sideVector  = new THREE.Vector3()
const moveVector  = new THREE.Vector3()

export function CameraControls({ gravity = -9.8 }) {
  const { camera } = useThree()
  const [, get] = useKeyboardControls()

  // track vertical velocity yourself
  const velY = useRef(0)

  useFrame((state, delta) => {
    const { forward, backward, left, right } = get()

    // 1) Horizontal movement
    frontVector.set( 0, 0, backward - forward )
    sideVector .set( left - right, 0, 0 )
    moveVector
      .subVectors( frontVector, sideVector )
      .normalize()
      .applyEuler( camera.rotation )       // align with camera
      .multiplyScalar( SPEED * delta*5 )

    camera.position.add( moveVector )

  
  })

  return null
}
