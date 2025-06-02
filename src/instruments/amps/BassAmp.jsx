import React, { forwardRef, useMemo, useRef } from 'react';
import { useGLTF, useHelper, useTexture } from '@react-three/drei';
import * as THREE from 'three';
export const BassAmp = forwardRef((props, ref) => {
  const { nodes, materials } = useGLTF('/amps/bass_amp.glb');
  const lightRef = useRef();
  // useHelper(lightRef, THREE.PointLightHelper, 1, 'hotpink');
  const [cabCol, cabNorm, cabMet, cabRough, headCol, headMet, headRough] =
    useTexture([
      '/amps/textures/FenderAmpCabinet_Base_color.png',
      '/amps/textures/FenderAmpCabinet_Metallic.png',
      '/amps/textures/FenderAmpCabinet_Norm_2kcomp.png',
      '/amps/textures/FenderAmpCabinet_Roughness.png',
      '/amps/textures/FenderAmpHead_Base_color.png',
      '/amps/textures/FenderAmpHead_Metallic.png',
      '/amps/textures/FenderAmpHead_Roughness.png',
    ]);

  const textures = [
    cabCol,
    cabNorm,
    cabMet,
    cabRough,
    headCol,
    headMet,
    headRough,
  ];
  textures.forEach((tex) => {
    tex.flipY = false;
    tex.needsUpdate = true; // ensure the change takes effect
  });

  const ampHeadMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: headCol,
        metalness: 0.8,
        metalnessMap: headMet,
        roughnessMap: headRough,
        roughness: 0.1,
      }),
    []
  );
  const ampCabMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: cabCol,
        metalnessMap: cabMet,
        roughnessMap: cabRough,
      }),
    []
  );
  return (
    <group
      {...props}
      dispose={null}
      rotation={[0, -Math.PI * 1.2, 0]}
      position={[-2, 0, 6]}
    >
      <group>
      <group position={[0,.4,0.483]}>
        <pointLight
          ref={lightRef}
          color={props.color} // initial value; ObjSound will overwrite each frame
          intensity={0}
          userData={{ intensityMultiplier: 2 }} 
          // scale={.15}
          // distance={120.5}
          castShadow
          decay={.8}
          // shadow-bias={-0.001}
          // shadow-mapSize-width={1024}
          // shadow-mapSize-height={1024}
          // shadow-radius={1}
          // shadow-camera-near={0.5} // move the near clipping plane
          // shadow-camera-far={60}
          // shadow-blurSamples={12}
        />
      </group>
        <mesh
          // castShadow
          // receiveShadow
          geometry={nodes.Cab.geometry}
          material={ampCabMat}
          position={[0, 0.434, -0.011]}
          side={THREE.DoubleSide}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Head.geometry}
          material={ampHeadMat}
          //  position={[0.001, 0.894, 0.039]}
        />
      </group>
    </group>
  );
});

useGLTF.preload('/amps/bass_amp.glb');
