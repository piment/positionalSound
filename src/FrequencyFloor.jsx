import React, { useRef, useMemo } from 'react'
import { useFrame }        from '@react-three/fiber'
import * as THREE          from 'three'

import floorVert from './shaders/FrequencyFloor-vert.glsl'
import floorFrag from './shaders/FrequencyFloor-frag.glsl'

// circular sprite texture
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
  numParticles    = 65536,
  width           = 100,
  depth           = 100,
  bounceThreshold = 0.02,
  impulseStrength = 15,
  gravity         = -9.8,
  minLife         = 0.1,
  maxLife         = 0.63,
  pointSize       = 3.5,
}) {
  const pointsRef = useRef();
  const total     = numParticles;
  const halfW     = width  / 2;
  const halfD     = depth  / 2;
  const maxRadius = Math.min(halfW, halfD);
    const minRadius = maxRadius * 0.02; 
        const radiusRange = maxRadius - minRadius;     
  // 1) STATIC BUFFERS
  // Add angle per particle for circular mapping
  const { positions, velocities, ages, lifetimes, binIndex, srcIndex, opacities, angles } = useMemo(() => {
    const pos     = new Float32Array(total * 3);
    const vel     = new Float32Array(total);
    const age     = new Float32Array(total);
    const life    = new Float32Array(total);
    const bin     = new Uint16Array(total);
    const src     = new Uint16Array(total);
    const opacity = new Float32Array(total);
    const ang     = new Float32Array(total);

    const binCount  = sources[0]?.analyser.frequencyBinCount ?? 128;
    // avoid exact center

    for (let i = 0; i < total; i++) {
      // pick a random bin and source
      const b = Math.floor(Math.random() * binCount);
      bin[i] = b;
      src[i] = Math.floor(Math.random() * sources.length);
      ang[i] = Math.random() * Math.PI * 2;

      // compute radial position based on bin
      const freqFactor = b / (binCount - 1);
      const r = minRadius + freqFactor * radiusRange;
      pos[3 * i + 0] = Math.cos(ang[i]) * r;
      pos[3 * i + 1] = 0;
      pos[3 * i + 2] = Math.sin(ang[i]) * r;

      vel[i]       = 0;
      age[i]       = life[i] + 1;
      opacity[i]   = 0;
    }
    return { positions: pos, velocities: vel, ages: age, lifetimes: life, binIndex: bin, srcIndex: src, opacities: opacity, angles: ang };
  }, [total, sources.length]);

  // 2) DYNAMIC BUFFERS
  const binCount   = sources[0]?.analyser.frequencyBinCount ?? 128;
  const colorArray = useMemo(() => new Float32Array(total * 3), [total]);
  const fftBuffers = useMemo(() => sources.map(s => new Uint8Array(s.analyser.frequencyBinCount)), [sources]);
  const prevSpectrum = useMemo(() => new Uint8Array(binCount), [binCount]);

  // 3) GEOMETRY
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color',    new THREE.BufferAttribute(colorArray, 3));
    g.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1));
    return g;
  }, [positions, colorArray, opacities]);

  // 4) MATERIAL
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader:   floorVert,
    fragmentShader: floorFrag,
    transparent:    true,
    depthWrite:     false,
    vertexColors:   true,
    uniforms: {
      uPointSize: { value: pointSize },
      uSprite:    { value: circleTexture },
    }
  }), [pointSize]);

  // 5) FRAME LOOP
  useFrame((_, delta) => {
    if (!playing || sources.length === 0) return;

    // update FFT data
    sources.forEach((src, i) => src.analyser.getByteFrequencyData(fftBuffers[i]));

    for (let i = 0; i < total; i++) {
      const base = 3 * i;
      const si   = srcIndex[i];
      const b    = binIndex[i];
      const buf  = fftBuffers[si];
      const amp  = (buf[b] / 255) * (sources[si].volume ?? 1);
      const prev = prevSpectrum[b] / 255;

      // age & physics
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

            // spawn on rising edge
      if (ages[i] > lifetimes[i] && amp > bounceThreshold && amp > prev) {
        ages[i]      = 0;
        lifetimes[i] = THREE.MathUtils.lerp(minLife, maxLife, amp);
        const freqFactor = b / (binCount - 1);
        const r = minRadius + freqFactor * radiusRange;
        const ang = angles[i];
        positions[base + 0] = Math.cos(ang) * r;
        positions[base + 2] = Math.sin(ang) * r;
        velocities[i] = amp * impulseStrength;
      }


      // update color & opacity
      sources[si].color.toArray(colorArray, base);
      opacities[i] = amp;

      // store last amplitude
      prevSpectrum[b] = buf[b];
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