
import React, { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from 'three'
import { useFrame } from "@react-three/fiber";
import { lerp } from "three/src/math/MathUtils";
export function Drums(props) {
  const { nodes, materials } = useGLTF("/drumLP.glb");
  const drumMat = new THREE.MeshStandardMaterial({ color : "#ff0000", emissive: "#ff0000", emissiveIntensity: 0})
  const standMat = new THREE.MeshPhongMaterial({color: "#a5a5a5"})
  
  
  
  let flickerIntensity
  let averageVolume = 0;

  let delta = 0;
  // 30 fps
  let interval = 1 / 30;
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

//      drumMat.emissiveIntensity = lerp(drumMat.emissiveIntensity,2 * (Math.pow(flickerIntensity, 2) /5), 0.2)

//     }
//   });
  
  return (
    <group {...props} dispose={null} position={[0,-.55,0]}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder.geometry}
        material={drumMat}
        position={[-0.422, 0.427, 0.146]}
        rotation={[0, -1.398, -Math.PI / 2]}
        scale={[0.412, 0.368, 0.412]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder004.geometry}
        material={drumMat}
        position={[-1.19, 0.464, -0.323]}
        rotation={[0, -1.398, 0]}
        scale={0.237}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder002.geometry}
        material={drumMat}
        position={[-0.128, 0.604, -0.605]}
        rotation={[0, -1.398, 0]}
        scale={[0.265, 0.073, 0.265]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder009.geometry}
        material={drumMat}
        position={[-0.242, 0.98, -0.023]}
        rotation={[0, -1.398, 0.189]}
        scale={[0.188, 0.089, 0.188]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder010.geometry}
        material={drumMat}
        position={[-0.702, 0.979, 0.051]}
        rotation={[0, -1.398, 0.137]}
        scale={[0.227, 0.103, 0.227]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle.geometry}
        material={drumMat}
        position={[0.228, 1.266, 0.004]}
        rotation={[0, -1.398, 0]}
        scale={0.33}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle001.geometry}
        material={drumMat}
        position={[-1.223, 1.266, 0.128]}
        rotation={[Math.PI, -0.38, Math.PI]}
        scale={0.403}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle003.geometry}
        material={drumMat}
        position={[0.47, 0.883, -0.518]}
        rotation={[1.692, 1.425, 1.227]}
        scale={0.224}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane002.geometry}
        material={standMat}
        position={[-0.52, 0.019, -0.416]}
        rotation={[0, -1.412, 0]}
        scale={[0.135, 0.048, 0.05]}
      />
    </group>
  );
}

useGLTF.preload("/drumLP.glb");
