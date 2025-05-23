import React, { useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
export function Drumkit({ onSelect, hiddenParts = [], ...props  }) {
  const { scene, nodes } = useGLTF('/drumkitpartedOPT.glb');
  const parts = scene.children.filter((c) => c.type === 'Group');

  function onGroupSelect(name) {
    const groupObj = allGroups.find((g) => g.name === name);
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

  function wrapGroup(name, children, position) {
    return (
      <group
        key={name}
        name={name}
        position={position}
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelect(name);
        }}
      >
        {children}
      </group>
    );
  }

  return (
    <group {...props} dispose={null}>
    {wrapGroup('tom3', [
        <mesh key="wood"   castShadow receiveShadow geometry={nodes.Circle015.geometry} />,
        <mesh key="met1"   castShadow receiveShadow geometry={nodes.Circle015_1.geometry} material={metalMat} />,
        <mesh key="met2"   castShadow receiveShadow geometry={nodes.Circle015_2.geometry} material={metalMat} />,
        <mesh key="met3"   castShadow receiveShadow                      material={metalMat} />,
        <mesh key="met4"   castShadow receiveShadow geometry={nodes.Circle015_3.geometry} material={metalMat} />,
        <mesh key="pad"    castShadow receiveShadow geometry={nodes.Circle015_5.geometry} />,
      ], [-0.172, 0.741, -0.269])}

      {wrapGroup('tom2', [
        <mesh key="wood"  castShadow receiveShadow geometry={nodes.Circle005.geometry} />,
        <mesh key="met1"  castShadow receiveShadow geometry={nodes.Circle005_1.geometry} material={metalMat} />,
        <mesh key="met2"  castShadow receiveShadow geometry={nodes.Circle005_2.geometry} material={metalMat} />,
        <mesh key="met3"  castShadow receiveShadow geometry={nodes.Circle005_3.geometry} material={metalMat} />,
        <mesh key="met4"  castShadow receiveShadow geometry={nodes.Circle005_4.geometry} material={metalMat} />,
        <mesh key="pad"   castShadow receiveShadow geometry={nodes.Circle005_5.geometry} material={padMat} />,
      ], [0.139, 0.831, -0.287])}

      {wrapGroup('crash', [
        <mesh key="c1" castShadow receiveShadow geometry={nodes.Circle044.geometry} material={metalMat} />,
        <mesh key="c2" castShadow receiveShadow geometry={nodes.Circle044_1.geometry} />,
        <mesh key="c3" castShadow receiveShadow geometry={nodes.Circle044_2.geometry} material={metalMat} />,
        <mesh key="c4" castShadow receiveShadow geometry={nodes.Circle044_3.geometry} material={padMat} />,
      ], [0.526, 0.478, -0.214])}

      <group name='ride' position={[-0.627, 0.468, -0.242]}>
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
        <mesh castShadow receiveShadow geometry={nodes.Circle023_3.geometry} />
      </group>

      <group name='stool' position={[-0.009, 0.459, -0.995]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle037.geometry}
          material={metalMat}
        />
        <mesh castShadow receiveShadow geometry={nodes.Circle037_1.geometry} />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle037_2.geometry}
          material={metalMat}
        />
        <mesh castShadow receiveShadow geometry={nodes.Circle037_3.geometry} />
      </group>

      <group name='tom4' position={[-0.497, 0.463, -0.578]}>
        <mesh castShadow receiveShadow geometry={nodes.Circle029.geometry} />
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
        <mesh castShadow receiveShadow geometry={nodes.Circle029_3.geometry} />
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

      <group name='snare' position={[0.433, 0.636, -0.519]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle021.geometry}
          material={redMat}
        />
        <mesh castShadow receiveShadow geometry={nodes.Circle021_1.geometry} />
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
        <mesh castShadow receiveShadow geometry={nodes.Circle021_4.geometry} />
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
        />
      </group>

      <group name='kick' position={[-0.002, 0.294, 0.013]}>
        <mesh castShadow receiveShadow geometry={nodes.Circle053.geometry} />
        <mesh castShadow receiveShadow geometry={nodes.Circle053_1.geometry} />
        <mesh castShadow receiveShadow geometry={nodes.Circle053_2.geometry} />
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
        <mesh castShadow receiveShadow geometry={nodes.Circle053_7.geometry} />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle053_8.geometry}
          material={metalMat}
        />
      </group>

      <group name='hihat' position={[0.63, 0.386, -0.798]}>
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
        />
      </group>
    </group>
  );
}

useGLTF.preload('/drumkitpartedOPT.glb');
