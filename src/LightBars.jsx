import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Animated ring of light bars that react to an AudioAnalyser.
 *
 * @param {number} [count=16]  Number of bars in the circle.
 * @param {number} radius      Radius of the circular arrangement.
 * @param {THREE.AudioAnalyser} analyser Optional THREE.AudioAnalyser for audio‑reactive behaviour.
 */
export default function LightBars({ count = 16, radius = 20, analyser }) {
  const groupRef = useRef();
  const dataArray = useRef();
  const randomYPositions = useRef([]);
  const [level, setLevel] = useState(0);

  // Create ONE cylinder geometry and share it across all meshes
  const cylinderGeometry = useMemo(
    () => new THREE.CylinderGeometry(0.2, 0.2, 45, 16),
    []
  );

  // Dispose the geometry on unmount to free GPU memory
  useEffect(() => {
    return () => cylinderGeometry.dispose();
  }, [cylinderGeometry]);

  // Set up analyser buffer and random offsets once
  useEffect(() => {
    if (analyser) {
      dataArray.current = new Uint8Array(analyser.frequencyBinCount);
    }

    randomYPositions.current = Array.from({ length: count }, () =>
      Math.random() * 30 + 2 // 2 ↔ 32
    );
  }, [analyser, count]);

  // Update audio level each frame
  useFrame(() => {
    if (!analyser || !dataArray.current) return;

    analyser.getByteFrequencyData(dataArray.current);

    const avg =
      dataArray.current.reduce((sum, v) => sum + v, 0) /
      dataArray.current.length /
      255;

    setLevel(avg);
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = randomYPositions.current[i];

        // Hue shifts slightly with audio level
        const emissive = new THREE.Color().setHSL(0.1 + level, 1, 1);

        return (
          <mesh
            key={i}
            geometry={cylinderGeometry}
            position={[x, 12 + y, z]}
          >
            <meshStandardMaterial
              emissive={emissive}
              emissiveIntensity={level * 10}
              color={"black"}
            />
          </mesh>
        );
      })}
    </group>
  );
}
