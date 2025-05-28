import React, { useRef, useMemo } from 'react'
import { useFrame }        from '@react-three/fiber'
import * as THREE          from 'three'

import floorVert from './shaders/FrequencyFloor-vert.glsl'
import floorFrag from './shaders/FrequencyFloor-frag.glsl'

// create a circular sprite texture
const circleTexture = (() => {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2, 0, Math.PI*2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
})();

export default function FrequencyFloor({
  sources = [],
  playing,
  numParticles = 165536,
  width = 100,
  depth = 100,
  bounceThreshold = 0.02,
  impulseStrength = 15,
  gravity = -9.8,
  minLife = 0.1,
  maxLife = 0.63,
  pointSize = 3.5,
}) {
  const pointsRef = useRef();
  const total     = numParticles;
  const halfW     = width / 2;
  const halfD     = depth / 2;

  // 1) STATIC BUFFERS (mount only)
  const {
    positions,
    velocities,
    ages,
    lifetimes,
    binIndex,
    srcIndex,
    opacities
  } = useMemo(() => {
    const pos  = new Float32Array(total * 3);
    const vel  = new Float32Array(total);
    const age  = new Float32Array(total);
    const life = new Float32Array(total);
    const bin  = new Uint16Array(total);
    const src  = new Uint16Array(total);
    const opacity = new Float32Array(total); // per-particle opacity

    const binCount = sources[0]?.analyser.frequencyBinCount ?? 128;

    for (let i = 0; i < total; i++) {
      pos[3*i + 0] = Math.random() * width - halfW;
      pos[3*i + 1] = 0;
      pos[3*i + 2] = Math.random() * depth - halfD;
      vel[i]       = 0;
      age[i]       = life[i] + 1;
      bin[i]       = Math.floor(Math.random() * binCount);
      src[i]       = Math.floor(Math.random() * sources.length);
      opacity[i]   = 0; // start fully transparent
    }

    return { positions: pos, velocities: vel, ages: age, lifetimes: life, binIndex: bin, srcIndex: src, opacities: opacity };
  }, [total, width, depth, sources.length]);

  // 2) DYNAMIC BUFFERS
  const binCount    = sources[0]?.analyser.frequencyBinCount ?? 128;
  const colorArray  = useMemo(() => new Float32Array(total * 3), [total]);
  const fftBuffers  = useMemo(() => sources.map(s => new Uint8Array(s.analyser.frequencyBinCount)), [sources]);

  // 3) BUILD GEOMETRY ONCE
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color',    new THREE.BufferAttribute(colorArray, 3));
    g.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1));
    return g;
  }, [positions, colorArray, opacities]);

  // 4) SHADER MATERIAL
  const material = useMemo(
    () => new THREE.ShaderMaterial({
      vertexShader:   floorVert,
      fragmentShader: floorFrag,
      transparent:    true,
      depthWrite:     false,
      vertexColors:   true,
      uniforms: {
        uPointSize: { value: pointSize },
        uSprite:    { value: circleTexture },
      }
    }),
    [pointSize]
  );

  // 5) FRAME LOOP
  useFrame((_, delta) => {
    if (!playing || sources.length === 0) return;
    sources.forEach((src, i) => src.analyser.getByteFrequencyData(fftBuffers[i]));

    for (let i = 0; i < total; i++) {
      const base = 3 * i;
      const si   = srcIndex[i];
      const b    = binIndex[i];
      const buf  = fftBuffers[si];
      const amp  = (buf[b] / 255) * (sources[si].volume ?? 1);

      // age & position update omitted for brevity; keep existing logic
      ages[i] += delta;
      if (ages[i] <= lifetimes[i]) {
        velocities[i] += gravity * delta;
        let y = positions[base + 1] + velocities[i] * delta;
        if (y < 0) {
          y = 0;
          ages[i] = lifetimes[i] + 1;
          velocities[i] = 0;
        }
        positions[base + 1] = y;
      } else {
        positions[base + 1] = 0;
      }
      if (ages[i] > lifetimes[i] && amp > bounceThreshold) {
        ages[i]       = 0;
        lifetimes[i]  = THREE.MathUtils.lerp(minLife, maxLife, amp);
        velocities[i] = amp * impulseStrength;
        positions[base + 0] = Math.random() * width  - halfW;
        positions[base + 2] = Math.random() * depth  - halfD;
      }

      // write per-particle opacity
      opacities[i] = amp*2;

      // recolor
      sources[si].color.toArray(colorArray, base);
    }

    const g = pointsRef.current.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.color.needsUpdate    = true;
    g.attributes.aOpacity.needsUpdate = true;
  });

  // 6) RENDER
  return (
    <group position={[0, 0.01, 0]}>
      <points ref={pointsRef} geometry={geom} material={material} />
    </group>
  );
}