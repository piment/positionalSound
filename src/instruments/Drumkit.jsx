import React, { useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
export function Drumkit(props) {
  const { scene, nodes, materials } = useGLTF('/drumkitOPT.glb');

const allGroups = scene.children.filter(c => c.type === 'Group');

function onGroupSelect(name) {
  const groupObj = allGroups.find(g => g.name === name);
  onAdd({ 
    name, 
    group: groupObj, 
    // you can still pass url/file/instrument if you like
  });
}
  const metalMat = useMemo(
    () => new THREE.MeshStandardMaterial({ metalness: 1, roughness: 0.1 }),
    []
  );
  const padMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#efe',
        metalness: 0,
        roughness: 0.1,
      }),
    []
  );

  const redMat = new THREE.MeshBasicMaterial({ color: 'red' });
  return (
    <group {...props} dispose={null}>
      <group name='tom3'>
        <mesh
          //tom3 wood
          castShadow
          receiveShadow
          geometry={nodes.Circle015.geometry}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle015_1.geometry}
       material={metalMat}
        />
        <mesh
          //tom 3 metal
          castShadow
          receiveShadow
          geometry={nodes.Circle015_2.geometry}
          material={metalMat}
        />
        <mesh
          //tom3 metal
          castShadow
          receiveShadow
        material={metalMat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle015_3.geometry}
   material={metalMat}
        />

        <mesh
          //tom 3 pads
          castShadow
          receiveShadow
          geometry={nodes.Circle015_5.geometry}
        />
      </group>


<group name='tom2'> <mesh
//tom2 wood
        castShadow
        receiveShadow
        geometry={nodes.Circle005.geometry}
       
      /> 
      
          <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle005_1.geometry}
 material={metalMat}
      />  
       <mesh
      //tom 2 metal
        castShadow
        receiveShadow
        geometry={nodes.Circle005_2.geometry}
   material={metalMat}
      />   
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle005_3.geometry}
         material={metalMat}
      /> 
        <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle005_4.geometry}
material={metalMat}
      />   
      <mesh
      //tom 2 pad
        castShadow
        receiveShadow
        geometry={nodes.Circle005_5.geometry}
            material={padMat}
      />
      </group>
     
 
<group name='crash'>

      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle044.geometry}
      material={metalMat}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle044_1.geometry}
        />
  
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle044_2.geometry}
material={metalMat}

      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle044_3.geometry}
     material={padMat}

      />    
      
        </group>


        <group name='ride'>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle023.geometry}
 material={metalMat}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle023_1.geometry}
   material={metalMat}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle023_2.geometry}
 material={metalMat}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle023_3.geometry}

      />
      </group>


<group name='stool'>

      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle037.geometry}
           material={metalMat}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle037_1.geometry}
               
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle037_2.geometry}
           material={metalMat}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle037_3.geometry}
            
      />
      
      </group>

      <group name='tom4'>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle029.geometry}
      

      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle029_1.geometry}
   material={metalMat}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle029_2.geometry}
 material={metalMat}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle029_3.geometry}
     
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle029_4.geometry}
material={metalMat}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle029_5.geometry}
       material={metalMat}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle029_6.geometry}
           material={padMat}
      />
      </group>


      <group name='snare'>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle021.geometry}
       material={redMat}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle021_1.geometry}
    
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle021_2.geometry}
   material={metalMat}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle021_3.geometry}
    material={metalMat}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle021_4.geometry}
        
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle021_5.geometry}
       material={metalMat}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle021_6.geometry}
        material={nodes.Circle021_6.material}
      /></group>

      <group name='kick'>

    
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle053.geometry}
   
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle053_1.geometry}

      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle053_2.geometry}
     
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle053_3.geometry}
         material={metalMat}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle053_4.geometry}
        material={metalMat}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle053_5.geometry}
         material={metalMat}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle053_6.geometry}
         material={metalMat}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle053_7.geometry}
    
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle053_8.geometry}
        material={metalMat}
      />
       </group>


       <group name='hihat'>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle054.geometry}
  material={metalMat}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle054_1.geometry}
       material={metalMat}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle054_2.geometry}
        material={nodes.Circle054_2.material}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle054_3.geometry}
        material={nodes.Circle054_3.material}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle054_4.geometry}
       material={metalMat}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Circle054_5.geometry}
        material={metalMat}
      /></group>
    </group>
  );
}

useGLTF.preload('/drumkitOPT.glb');
