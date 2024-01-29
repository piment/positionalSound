import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import React, { useRef } from 'react'

export const Controls = () => {
  const { camera, gl } = useThree()
  const ref = useRef()
  useFrame(() => ref.current.update())
  return <OrbitControls ref={ref} target={[0, 0, 0]} enableDamping args={[camera, gl.domElement]} />
}

export default Controls