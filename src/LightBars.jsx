import { useRef, useEffect, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function LightBars({ count = 16, radius = 20, analyser }) {
  const groupRef = useRef();
  const dataArray = useRef();
  const randomYPositions = useRef([]);
  const [level, setLevel] = useState(0);

  // 1) Create one shared geometry and one shared material.
  const cylinderGeometry = useMemo(
    () => new THREE.CylinderGeometry(0.2, 0.2, 45, 16),
    []
  );
  const sharedMaterial = useMemo(() => {
    // Start with some default emissive hue; we'll override it per frame.
    return new THREE.MeshStandardMaterial({
      color: "black",
      emissive: new THREE.Color().setHSL(0.1, 1, 1),
      emissiveIntensity: 0,
    });
  }, []);

  // Dispose of geometry + material on unmount
  useEffect(() => {
    return () => {
      cylinderGeometry.dispose();
      sharedMaterial.dispose();
    };
  }, [cylinderGeometry, sharedMaterial]);

  // Set up analyser buffer & random offsets once
  useEffect(() => {
    if (analyser) {
      dataArray.current = new Uint8Array(analyser.frequencyBinCount);
    }
    randomYPositions.current = Array.from({ length: count }, () =>
      Math.random() * 30 + 2
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

    // 2) Now update the one shared material’s uniforms (or Color)
    sharedMaterial.emissive.setHSL(0.1 + avg, 1, 1);
    sharedMaterial.emissiveIntensity = avg * 10;
    sharedMaterial.needsUpdate = false; // only needed if we changed defines; for uniform updates, this can stay false
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = randomYPositions.current[i];

        return (
          <mesh
            key={i}
            geometry={cylinderGeometry}
            material={sharedMaterial}
            position={[x, 12 + y, z]}
          />
        );
      })}
    </group>
  );
}
