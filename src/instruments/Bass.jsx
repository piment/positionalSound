import React, { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from 'three'
import { useFrame } from "@react-three/fiber";
import { lerp } from "three/src/math/MathUtils";
export function Bass(props) {
  const { nodes, materials } = useGLTF("/BassPosi.glb");
  
  const bassMat = new THREE.MeshStandardMaterial({ color : "#ff0000", emissive: "#ff0000", emissiveIntensity: 0})



  let flickerIntensity
  let averageVolume = 0;

  let delta = 0;
  // 30 fps
  let interval = 1 / 10;




//   useFrame((state) => {
//     delta += state.clock.getDelta();

//     if (delta  < interval) {
     
//         state.invalidate()
//         delta = delta % interval;
//     }
//     const dataArray = props.audioDataArray.current;
//      const sum = dataArray.reduce((acc, val) => acc + (val-128), 0);
 
//   averageVolume = sum / dataArray.length;



//  flickerIntensity = averageVolume; 


//     if (props.isPlaying) {

//      bassMat.emissiveIntensity = lerp(bassMat.emissiveIntensity,1 * (Math.pow(flickerIntensity, 2) /5), 0.2)

//     }
//   });
  
  
  return (
    <group {...props} dispose={null} scale={0.02}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_6.geometry}
        material={bassMat}
        position={[-56.485, 38.756, 36.167]}
        rotation={[-0.041, 0.011, 0.278]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_6001.geometry}
        material={bassMat}
        position={[-56.485, 38.756, 36.167]}
        rotation={[-0.041, 0.011, 0.278]}
      />
    </group>
  );
}

useGLTF.preload("/BassPosi.glb");
