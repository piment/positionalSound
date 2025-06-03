import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function LightBars({ count = 16, radius , analyser }) {
  const groupRef = useRef();
  const [level, setLevel] = useState(0);
  const dataArray = useRef();
  const randomYPositions = useRef([]);

  useEffect(() => {
    if (analyser) {
      dataArray.current = new Uint8Array(analyser.frequencyBinCount);
    }

    // generate random Y offsets once
    randomYPositions.current = Array.from({ length: count }, () =>
      Math.random() * 30 + 2 // range: 5 to 10
    );
  }, [analyser, count]);

  useFrame(() => {
    if (!analyser || !dataArray.current) return;

    analyser.getByteFrequencyData(dataArray.current);
    const avg =
      dataArray.current.reduce((sum, val) => sum + val, 0) /
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

        const emissive = new THREE.Color().setHSL(0.1 + level * 1, 1, 1);
        return (
          <mesh key={i} position={[x, 12+y, z]}>
            <cylinderGeometry args={[0.2, 0.2, 45, 16]} />
            <meshStandardMaterial
              emissive={emissive}
              emissiveIntensity={level * 10}
              color="black"
            />
          </mesh>
        );
      })}
    </group>
  );
}
