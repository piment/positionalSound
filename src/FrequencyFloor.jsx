// FrequencyFloor.jsx
import React, { useRef, useMemo } from 'react'
import { useFrame }           from '@react-three/fiber'
import * as THREE             from 'three'

export default function FrequencyFloor({
  sources = [],
  playing,
  numParticles = 65536,
  width        = 40,
  depth        = 40,
  bounceThreshold = 0.02,
  impulseStrength = 1,
  gravity         = -9.8,
  restitution     = 0.95,
  pointSize       = 0.03,
  maxHeight       = 5,
}) {
  const ref = useRef()
  const total = numParticles
  const halfW = width / 2
  const halfD = depth / 2

  // 1) Static buffers (positions, velocities, binIndex, ages, lifetimes)
  const { positions, velocities, binIndex, ages, lifetimes } = useMemo(() => {
    const pos  = new Float32Array(total * 3)
    const vel  = new Float32Array(total)
    const bin  = new Uint32Array(total)
    const age  = new Float32Array(total)
    const life = new Float32Array(total)
    const binCount = sources[0]?.analyser.frequencyBinCount ?? 128
    for (let i = 0; i < total; i++) {
      pos[3*i+0] = Math.random()*width  - halfW
      pos[3*i+1] = 0
      pos[3*i+2] = Math.random()*depth  - halfD
      vel[i]     = 0
      age[i]     = Infinity    // dead until first hit
      life[i]    = 0
      bin[i]     = Math.floor(Math.random()*binCount)
    }
    return { positions: pos, velocities: vel, binIndex: bin, ages: age, lifetimes: life }
  }, [total, width, depth])

  // 2) Dynamic buffers: combined spectrum + per-source FFT + color array
  const binCount   = sources[0]?.analyser.frequencyBinCount ?? 128
  const freqData   = useMemo(() => new Float32Array(binCount), [binCount])
  const fftBuffers = useMemo(() => sources.map(() => new Uint8Array(binCount)), [sources, binCount])
  const colorArray = useMemo(() => new Float32Array(total * 3), [total])

  // color palette
  const palette = useMemo(() => {
    return Array.from({ length: binCount }, (_, b) =>
      new THREE.Color().setHSL((b/(binCount-1))*0.7, 1, 0.5)
    )
  }, [binCount])

  // 3) Memoize geometry
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('color',    new THREE.BufferAttribute(colorArray, 3))
    return g
  }, [positions, colorArray])

  // 4) Memoize one material
  const mat = useMemo(() => 
    new THREE.PointsMaterial({
      vertexColors: true,
      size: pointSize,
      sizeAttenuation: true,
    })
  , [pointSize])

  // 5) The frame loop: bail out if not playing or no sources
  useFrame((_, dt) => {
    if (!playing || sources.length === 0) return

    // a) build & clamp combined spectrum
    freqData.fill(0)
    sources.forEach((src, i) => {
      const buf = fftBuffers[i]
      src.analyser.getByteFrequencyData(buf)
      const vol = src.volume
      for (let b = 0; b < binCount; b++) {
        freqData[b] += (buf[b]/255) * vol
      }
    })
    for (let b = 0; b < binCount; b++) {
      freqData[b] = Math.min(1, freqData[b])
    }

    // b) your existing spark‐and‐bounce logic
    for (let i = 0; i < total; i++) {
      const yi = 3*i + 1
      const amp = freqData[ binIndex[i] ]

      // kick
      const headroom = Math.max(0, (maxHeight - positions[yi]) / maxHeight)
      if (amp > bounceThreshold && headroom > 0) {
        velocities[i] += (amp - bounceThreshold) * impulseStrength * headroom
      }

      // gravity & integration
      velocities[i] += gravity * dt
      let y = positions[yi] + velocities[i] * dt
      if (y < 0) {
        y = 0
        velocities[i] = -velocities[i] * restitution
      }
      positions[yi] = y

      // recolor
      palette[ binIndex[i] ].toArray(colorArray, 3*i)
    }

    // c) upload updates
    const g = ref.current.geometry
    g.attributes.position.needsUpdate = true
    g.attributes.color.needsUpdate    = true
  })

  // 6) Always render the points (so geom & mat get created once)
  return (
    <group position={[0, 0.01, 0]}>
      <points ref={ref} geometry={geom} material={mat} />
    </group>
  )
}
