// SoundParticles.jsx
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

export default function SoundParticles({
  emitterRef,
  playLevel,
  maxParticles = 10000,
  minLife = 1.5, // sec
  maxLife = 13.5, // sec
  baseSpeed = 0.52, // how fast dust flies out
}) {
  const pointsRef = useRef();

  // 1) Initialize buffers (once)
  const particles = useMemo(() => {
    const pos = new Float32Array(maxParticles * 3); // start all at 0,0,0
    const vel = new Float32Array(maxParticles * 3);
    const age = new Float32Array(maxParticles);
    const life = new Float32Array(maxParticles);

    for (let i = 0; i < maxParticles; i++) {
      // start at emitter center
      pos.set([0, 0, 0], 3 * i);

      // random outward direction
      const dir = new THREE.Vector3()
        .randomDirection()
        .multiplyScalar(baseSpeed);
      vel.set([dir.x, dir.y, dir.z], 3 * i);

      // staggered spawn times so they don't all die at once
      age[i] = Math.random() * (maxLife - minLife);
      life[i] = minLife + Math.random() * (maxLife - minLife);
    }

    return { pos, vel, age, life };
  }, [maxParticles, minLife, maxLife, baseSpeed]);

  // 2) Update every frame
  useFrame((_, delta) => {
    const points = pointsRef.current;
    const emitter = emitterRef.current;
    if (!points || !emitter) return;

    const { pos, vel, age, life } = particles;

    // control how many particles are alive by sound level
    const drawCount = Math.floor(playLevel * 2 * maxParticles);

    for (let i = 0; i < drawCount; i++) {
      age[i] += delta;
      const idx3 = 3 * i;

      if (age[i] >= life[i]) {
        // respawn at emitter's local origin
        pos[idx3] = 0;
        pos[idx3 + 1] = 0;
        pos[idx3 + 2] = 0;

        // new random outward velocity
        const dir = new THREE.Vector3()
          .randomDirection()
          .multiplyScalar(baseSpeed);
        vel[idx3] = dir.x;
        vel[idx3 + 1] = dir.y;
        vel[idx3 + 2] = dir.z;

        // reset timers
        age[i] = 0;
        life[i] = minLife + Math.random() * (maxLife - minLife);
      } else {
        // drift outward
        pos[idx3] += vel[idx3] * delta;
        pos[idx3 + 1] += vel[idx3 + 1] * delta;
        pos[idx3 + 2] += vel[idx3 + 2] * delta;
      }
    }

    // tell Three.js to upload the new positions & adjust how many to draw
    const geom = points.geometry;
    geom.attributes.position.needsUpdate = true;
    geom.setDrawRange(0, drawCount);
  });
// console.log(emitterRef)
  // 3) Render a Points cloud at the emitter
  return (
    <points ref={pointsRef} frustumCulled={false} position={emitterRef.current?.position}>
      <bufferGeometry>
        <bufferAttribute
          attach='attributes-position'
          count={maxParticles}
          array={particles.pos}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={THREE.MathUtils.lerp(0.05, 2.3, playLevel)} // from small to bigger
        // blending={THREE.AdditiveBlending}
        // transparent
        opacity={THREE.MathUtils.lerp(0.1, 0.6, playLevel)}
        // depthWrite={false}
        color='#ffccff'
        sizeAttenuation
      />
    </points>
  );
}
