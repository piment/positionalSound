// FrequencyFloor.jsx
import React, { useRef, useMemo } from 'react'
import { useFrame }        from '@react-three/fiber'
import * as THREE          from 'three'

export default function FrequencyFloor({
  sources = [],            // [ { analyser, volume, color: THREE.Color }, … ]
  playing,                 // boolean play flag from App
  numParticles    = 65536, // how many sparks
  width           = 100,   // floor size
  depth           = 100,
  bounceThreshold = 0.02,  // min amp to trigger a spark
  impulseStrength = 15,    // how fast they shoot up
  gravity         = -9.8,  // downward accel
  minLife         = 0.1,   // seconds before "death"
  maxLife         = 0.63,
  pointSize       = 0.05,
}) {
  const pointsRef = useRef()
  const total     = numParticles
  const halfW     = width  / 2
  const halfD     = depth  / 2

  // ─── 1) STATIC BUFFERS (mount only) ─────────────────────────────
  const { positions, velocities, ages, lifetimes, binIndex, srcIndex } = useMemo(() => {
    const pos  = new Float32Array(total * 3)
    const vel  = new Float32Array(total)
    const age  = new Float32Array(total)
    const life = new Float32Array(total)
    const bin  = new Uint16Array(total)
    const src  = new Uint16Array(total)

    // assume all analysers share the same binCount
    const binCount = sources[0]?.analyser.frequencyBinCount ?? 128

    for (let i = 0; i < total; i++) {
      // random floor XZ
      pos[3*i + 0] = Math.random() * width  - halfW
      pos[3*i + 1] = 0
      pos[3*i + 2] = Math.random() * depth  - halfD

      vel[i]      = 0
      age[i]      = life[i] + 1   // start “dead”
      bin[i]      = Math.floor(Math.random() * binCount)
      src[i]      = Math.floor(Math.random() * sources.length)
    }

    return {
      positions: pos,
      velocities: vel,
      ages: age,
      lifetimes: life,
      binIndex: bin,
      srcIndex: src,
    }
  }, [total, width, depth, sources.length])

  // ─── 2) DYNAMIC BUFFERS ──────────────────────────────────────────
  const colorArray = useMemo(() => new Float32Array(total * 3), [total])
  const fftBuffers = useMemo(
    () => sources.map(s => new Uint8Array(s.analyser.frequencyBinCount)),
    [sources]
  )

  // ─── 3) BUILD GEOMETRY ONCE ──────────────────────────────────────
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('color',    new THREE.BufferAttribute(colorArray, 3))
    return g
  }, [positions, colorArray])

  // ─── 4) FRAME LOOP ────────────────────────────────────────────────
  useFrame((_, delta) => {
    if (!playing || sources.length === 0) return

    // a) sample each source
    sources.forEach((src, i) => {
      src.analyser.getByteFrequencyData(fftBuffers[i])
    })

    // b) update every particle
    for (let i = 0; i < total; i++) {
      const base = 3 * i
      const si   = srcIndex[i]
      const b    = binIndex[i]
      const buf  = fftBuffers[si]
      const amp  = (buf[b] / 255) * (sources[si].volume ?? 1)

      // age it
      ages[i] += delta

      // if “alive”, let it fall
      if (ages[i] <= lifetimes[i]) {
        velocities[i] += gravity * delta
        let y = positions[base + 1] + velocities[i] * delta

        // when it hits the floor → kill it (no bounce)
        if (y < 0) {
          y = 0
          ages[i] = lifetimes[i] + 1
          velocities[i] = 0
        }
        positions[base + 1] = y
      } else {
        // dead particles sit at floor
        positions[base + 1] = 0
      }

      // if dead & threshold crossed → spawn new spark
      if (ages[i] > lifetimes[i] && amp > bounceThreshold) {
        ages[i]      = 0
        lifetimes[i] = THREE.MathUtils.lerp(minLife, maxLife, amp)
        velocities[i]= amp * impulseStrength

        // optional: re-randomize XZ
        positions[base + 0] = Math.random() * width  - halfW
        positions[base + 2] = Math.random() * depth  - halfD
      }

      // recolor by its source’s chosen color
      const c = sources[si].color
      c.toArray(colorArray, base)
    }

    // c) upload back to GPU
    const g = pointsRef.current.geometry
    g.attributes.position.needsUpdate = true
    g.attributes.color.needsUpdate    = true
  })

  // ─── 5) RENDER ────────────────────────────────────────────────────
  return (
    <group position={[0, 0.01, 0]}>
      <points ref={pointsRef} geometry={geom}>
        <pointsMaterial vertexColors size={pointSize} sizeAttenuation />
      </points>
    </group>
  )
}
