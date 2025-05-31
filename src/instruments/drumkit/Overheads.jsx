import React, { forwardRef, useMemo, useRef } from 'react';
import { SpotLight, useDepthBuffer, useGLTF } from '@react-three/drei';
import { drumkit } from './drumkitMaterials';
export const Overheads = forwardRef((props, ref) => {
  const { nodes, materials } = useGLTF('/drumkit/Overhead.glb');

  const metalMat = useMemo(() => drumkit.metalMat.clone(), []);
  const padMat = useMemo(() => drumkit.padMat.clone(), []);
  const woodMat = useMemo(() => drumkit.woodMat.clone(), []);

  return (
    <group {...props} dispose={null} scale={1.5}>
      <group position={[0, 0, -0.25]}>
 
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Torus_1.geometry}
          material={nodes.Torus_1.material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Torus_2.geometry}
          material={padMat}
       
        />
      </group>
    </group>
  );
});
useGLTF.preload('/drumkit/Overhead.glb');
