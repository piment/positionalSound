import React, { useRef, useMemo } from 'react'
import { useFrame }         from '@react-three/fiber'
import * as THREE           from 'three'
import floorVert            from './shaders/FrequencyFloor-vert.glsl'
import floorFrag            from './shaders/FrequencyFloor-frag.glsl'

// circular sprite texture
const circleTexture = (() => {
  const size = 64
  const c    = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(size/2, size/2, size/2, 0, Math.PI*2)
  ctx.fill()
  const tex = new THREE.CanvasTexture(c)
  tex.needsUpdate = true
  return tex
})()

/**
 * FrequencyFloor
 * Renders a grid of points where each source's spectrum is a row
 * and each point's height is the bin amplitude
 */
export default function FrequencyFloor({
 sources = [],
  playing = false,
  width = 100,
  depth = 100,      // history length
  maxHeight = 10,
  pointSize = 0.62,
    smoothing = .5,
      fadePower = 0.5,
        subdivisions= 4
}) {
  const pointsRef = useRef()

  const sourceCount = sources.length || 1
  const binCount = sources[0]?.analyser.frequencyBinCount || 0
    const subBinCount = (binCount - 1) * subdivisions + 1
  const total = depth * sourceCount * binCount
  const halfW = width / 2
  const halfZ = depth / 2

  // log frequency
  const fMin = 20, fMax = 20000
  const logMin = Math.log10(fMin), logMax = Math.log10(fMax)

  // 1) static grid: X,Z and initial Y=0
 const { positions, colors, opacities, indices } = useMemo(() => {
      const pos = new Float32Array(total * 3)
    const col = new Float32Array(total * 3)
    const opa = new Float32Array(total)
    const indices = []

    // initialize per-vertex data and build quad indices
    for (let t = 0; t < depth; t++) {
      const z = t - halfZ
      sources.forEach(({ analyser, color }, s) => {
   const nyquist = analyser.context.sampleRate / 2
        for (let b = 0; b < binCount; b++) {
          const flatIndex = ((t * sourceCount + s) * binCount) + b
          const base3 = flatIndex * 3

          // X position (log freq)
          let f = (b / (binCount - 1)) * nyquist
          f = Math.max(Math.min(f, fMax), fMin)
          const xNorm = (Math.log10(f) - logMin) / (logMax - logMin)
          // Uniformly space bins on a log scale so low frequencies have no gaps
          pos[base3] = xNorm * width - halfW 

          // Y (updated dynamically)
          pos[base3 + 1] = 0

          // Z time slice
          pos[base3 + 2] = z + Math.random()

          // vertex color
          color.toArray(col, base3)

          // full opacity
          opa[flatIndex] = 1

          // build indices for mesh quads
          if (t < depth - 1 && b < binCount - 1) {
            const i00 = flatIndex
            const i01 = i00 + 1
            const i10 = i00 + (sourceCount * binCount)
            const i11 = i10 + 1
            indices.push(i00, i10, i01, i10, i11, i01)
          }
        }
      })
    }
    return {positions: pos, colors: col, opacities: opa, indices: indices }
      }, [sources, width, depth])
  // 2) FFT buffers
  const fftBuffers = useMemo(
    () => sources.map(src => new Uint8Array(src.analyser.frequencyBinCount)),
    [sources]
  )

  // 3) geometry
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    g.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1))
    g.setIndex(indices)
    g.computeVertexNormals()
    g.computeBoundingSphere()
    return g
  }, [positions, colors, opacities, indices])

  // custom shader material
  const mat = useMemo(
    () => new THREE.ShaderMaterial({
      vertexShader: floorVert,
      fragmentShader: floorFrag,
      transparent: true,
      depthWrite: false,
      vertexColors: true,
      uniforms: {
        uPointSize: { value: pointSize },
        uSprite: { value: circleTexture },
      },
    }),
    [pointSize]
  )

  // animation loop
  useFrame((_, delta) => {
    if (!playing || !sources.length) return

    const posAttr = pointsRef.current.geometry.attributes.position
    const arr = posAttr.array
    const sliceSize = sourceCount * binCount * 3

    // shift, smooth, and fade backward
    for (let t = depth - 1; t > 0; t--) {
      const dst = t * sliceSize
      const src = (t - 1) * sliceSize
      const env = Math.pow(1 - (t/50 )/ (depth - 1), fadePower)
      for (let i = 1; i < sliceSize; i += 3) {
        const prevVal = arr[dst + i]
        const freshVal = arr[src + i]
        const blended = THREE.MathUtils.lerp(prevVal, freshVal, 1 - smoothing)
        arr[dst + i] = blended * env
      }
    }

    // write new slice at t=0
    for (let s = 0; s < sourceCount; s++) {
      sources[s].analyser.getByteFrequencyData(fftBuffers[s])
      const buf = fftBuffers[s]
      const vol = sources[s].volume ?? 1
      const base = s * binCount * 3
      for (let b = 0; b < binCount; b++) {
        arr[base + 3 * b + 1] = (buf[b] / 255) * maxHeight * vol
      }
    }

    posAttr.needsUpdate = true
  })


  return <points ref={pointsRef} geometry={geom} material={mat} />
}
