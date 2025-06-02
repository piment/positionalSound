import React, { useRef, useMemo } from 'react'
import { useFrame }           from '@react-three/fiber'
import * as THREE             from 'three'

export default function FrequencyFloor({
  analyser,          // [{ analyser, volume }, …]
  playing,               // boolean flag from App
  numParticles    = 65536,
  width           = 100,
  depth           = 100,
  bounceThreshold = 0.21,
  impulseStrength = 5,
  gravity         = -9.8,
  restitution     = 0.95,
  pointSize       = 0.03,
  minLife         = 0.13,
  maxLife         = 0.3,
}) {
  const ref = useRef()
  const total = numParticles
  const halfW = width/2
  const halfD = depth/2

  // 1) Static buffers (only run on mount)
  const { positions, velocities, binIndex, ages, lifetimes } = useMemo(() => {
    const pos  = new Float32Array(total*3)
    const vel  = new Float32Array(total)
    const bin  = new Uint32Array(total)
    const age  = new Float32Array(total)
    const life = new Float32Array(total)
    const binCount = analyser.frequencyBinCount ?? 128

    for (let i = 0; i < total; i++) {
      pos[3*i+0] = Math.random()*width  - halfW
      pos[3*i+1] = 0
      pos[3*i+2] = Math.random()*depth  - halfD
      vel[i]     = 0
      age[i]     = life[i] + 1    // start dead
      bin[i]     = Math.floor(Math.random()*binCount)
    }
    return { positions: pos, velocities: vel, binIndex: bin, ages: age, lifetimes: life }
  }, [total, width, depth, analyser.frequencyBinCount])  // <- notice: NO `sources` here

  // 2) Dynamic buffers
  const fftSize    = analyser.fftSize 
  const binCount   = analyser.frequencyBinCount ?? 128
  const freqData   = useMemo(() => new Uint8Array(binCount), [binCount])
  // const fftBuffers = useMemo(() => sources.map(()=>new Uint8Array(binCount)), [sources, binCount])
  const colorArray = useMemo(() => new Float32Array(total*3), [total])
const sampleRate = analyser.context.sampleRate
  const palette = useMemo(() => {
    return Array.from({length:binCount},(_,b)=>
      new THREE.Color().setHSL((b/(binCount-1))*0.7,1,0.5)
    )
  }, [binCount])

  // 3) One-off geometry & material
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('color',    new THREE.BufferAttribute(colorArray, 3))
    return g
  }, [positions, colorArray])

  const mat = useMemo(() =>
    new THREE.PointsMaterial({
      vertexColors: true,
      size: pointSize,
      sizeAttenuation: true,
    })
  , [pointSize])

  // 4) Frame loop: bail early if stopped
 useFrame((_, dt) => {
    if (!playing) return

    // a) read the FFT into our Uint8Array
    analyser.getByteFrequencyData(freqData)

    // b) update particles
    for (let i = 0; i < total; i++) {
      const yi  = 3*i + 1
      const amp = freqData[ binIndex[i] ] / 255
      ages[i]   += dt

      // alive → gravity & integrate
      if (ages[i] <= lifetimes[i]) {
        velocities[i] += gravity * dt
        let y = positions[yi] + velocities[i] * dt
        if (y < 0) {
          y = 0
          ages[i] = lifetimes[i] + 1  // kill on floor
        }
        positions[yi] = y
      } else {
        positions[yi] = 0
      }

      // spawn on threshold
      if (ages[i] > lifetimes[i] && amp > bounceThreshold) {
        ages[i]       = 0
        lifetimes[i]  = THREE.MathUtils.lerp(minLife, maxLife, amp)
        velocities[i] = amp * impulseStrength
        // randomize XZ
        positions[3*i+0] = Math.random()*width  - halfW
        positions[3*i+2] = Math.random()*depth  - halfD
      }

      // recolor
      const b    = binIndex[i]
    const freq = b * (sampleRate / fftSize)
    // clamp + log→hue:
    const f    = Math.min(20000, Math.max(20, freq))
    const hue  = (Math.log10(f) - Math.log10(20))
               / (Math.log10(15000) - Math.log10(20))
               * 0.7
    
    const color = new THREE.Color().setHSL(hue, 1, amp)
    color.toArray(colorArray, 3 * i)
    }

    // upload updates
    const g = ref.current.geometry
    g.attributes.position.needsUpdate = true
    g.attributes.color.needsUpdate    = true
  })

  // 5) Always render once, never un-mount
  return (
    <group position={[0,0.01,0]}>
      <points ref={ref} geometry={geom} material={mat} />
    </group>
  )
}
