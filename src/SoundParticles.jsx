// SoundParticles.jsx
import React, { useMemo, useRef } from 'react';
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

export default function SoundParticles({
 emitterRef,
  playLevel,
  maxParticles = 300,

  // **new** speed‐range props
  minSpeed    = 0.2,   // slow drift
  maxSpeed    = 3.0,   // fast burst

  // rest of your props…
  minSize      = 0.05,
  maxSize      = 0.3,
  minLife      = 0.5,
  maxLife      = 5.0,
}) {
  const meshRef  = useRef()
  const tmpMat   = useMemo(() => new THREE.Matrix4(), [])
  const tmpPos   = useMemo(() => new THREE.Vector3(), [])
  const tmpQuat  = useMemo(() => new THREE.Quaternion(), [])
  const tmpScale = useMemo(() => new THREE.Vector3(), [])
  const tmpDir   = useMemo(() => new THREE.Vector3(), [])

  // 1) Initialize particle state
  const state = useMemo(() => {
    const pos  = new Float32Array(maxParticles * 3)
    const vel  = new Float32Array(maxParticles * 3)
    const age  = new Float32Array(maxParticles)
    const life = new Float32Array(maxParticles)
    const size = new Float32Array(maxParticles)

    for (let i = 0; i < maxParticles; i++) {
      // start at local origin
      pos.set([0, 0, 0], 3 * i)

      // give each a random initial velocity
      const speed = THREE.MathUtils.lerp(minSpeed, maxSpeed, Math.random())
      tmpDir.randomDirection().multiplyScalar(speed)
      vel.set([tmpDir.x, tmpDir.y, tmpDir.z], 3 * i)

      // full lifetime, start age=0 so they live their full span
      life[i] = minLife + Math.random() * (maxLife - minLife)
      age[i]  = 0

      // size will be set on spawn
      size[i] = 0
    }

    return { pos, vel, age, life, size }
  }, [maxParticles, minLife, maxLife, minSpeed, maxSpeed])

  // 2) Per-frame update
  useFrame((_, delta) => {
    const mesh    = meshRef.current
    const emitter = emitterRef.current
    if (!mesh || !emitter) return

    const { pos, vel, age, life, size } = state
    const count = Math.floor(playLevel * maxParticles)
    const drag  = 0.96

    for (let i = 0; i < count; i++) {
      const idx3 = 3 * i
      age[i] += delta

      if (age[i] >= life[i]) {
        // respawn at local origin
        pos.set([0, 0, 0], idx3)

        // choose burst speed proportional to loudness
        const speed = THREE.MathUtils.lerp(minSpeed, maxSpeed, playLevel)
        tmpDir.randomDirection().multiplyScalar(speed)
        vel.set([tmpDir.x, tmpDir.y, tmpDir.z], idx3)

        // reset timers
        age[i]  = 0
        life[i] = minLife + Math.random() * (maxLife - minLife)

        // capture birth-size once
        size[i] = THREE.MathUtils.lerp(minSize, maxSize, playLevel)
      } else {
        // apply drag each frame
        vel[idx3]   *= drag
        vel[idx3+1] *= drag
        vel[idx3+2] *= drag

        // move
        pos[idx3]   += vel[idx3]   * delta
        pos[idx3+1] += vel[idx3+1] * delta
        pos[idx3+2] += vel[idx3+2] * delta
      }

      // compose local matrix
      tmpPos.set(pos[idx3], pos[idx3+1], pos[idx3+2])
      tmpQuat.identity()
      tmpScale.set(size[i], size[i], size[i])
      tmpMat.compose(tmpPos, tmpQuat, tmpScale)
      mesh.setMatrixAt(i, tmpMat)
    }

    mesh.count = count
    mesh.instanceMatrix.needsUpdate = true
  })

  // 3) the instanced mesh itself
  const geom = useMemo(() => new THREE.PlaneGeometry(1, 1), [])
  const mat  = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#88ccff',
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    []
  )

  const instanced = (
    <instancedMesh
      ref={meshRef}
      args={[geom, mat, maxParticles]}
      frustumCulled={false}
    />
  );

  // 4) portal it into the emitter’s group so it shares its local space
  const { scene } = useThree();
  return emitterRef.current
    ? createPortal(instanced, emitterRef.current)
    : null;
}
