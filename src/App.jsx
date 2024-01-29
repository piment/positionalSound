import { Suspense, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  TransformControls,
  ContactShadows,
  useGLTF,
  useCursor,
  PositionalAudio,
} from '@react-three/drei';
import { proxy, useSnapshot } from 'valtio';
import './App.css';
// Reactive state model, using Valtio ...
const modes = ['translate', 'rotate', 'scale'];
const state = proxy({ current: null, mode: 0 });

function Model({ name, url, distance, ...props }) {
  const trackRef = useRef();
  const snap = useSnapshot(state);

  const { nodes } = useGLTF('/compressed.glb');
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const toggleTrack = () => {
    if (trackRef.current.getVolume() !== 0) {
      trackRef.current.setVolume(0);
      // click(true)
    } else if (trackRef.current.getVolume() === 0) {
      trackRef.current.setVolume(1);
      // click(false)
    }
  };
  return (
    <mesh
      // Click sets the mesh as the new target
      onClick={(e) => (e.stopPropagation(), (state.current = name))}
      // If a click happened but this mesh wasn't hit we null out the target,
      // This works because missed pointers fire before the actual hits
      onPointerMissed={(e) => e.type === 'click' && (state.current = null)}
      // Right click cycles through the transform modes
      onContextMenu={(e) =>
        snap.current === name &&
        (e.stopPropagation(), (state.mode = (snap.mode + 1) % modes.length))
      }
      onPointerOver={(e) => (e.stopPropagation(), setHovered(true))}
      onPointerOut={(e) => setHovered(false)}
      onDoubleClick={toggleTrack}
      name={name}
      geometry={nodes[name].geometry}
      material={nodes[name].material}
      material-color={snap.current === name ? '#ff6080' : 'white'}
      {...props}
      dispose={null}
    >
      {url && (
        <PositionalAudio
          ref={trackRef}
          autoplay={true}
          loop
          url={url}
          distance={distance}
        />
      )}
    </mesh>
  );
}

function Controls() {
  const snap = useSnapshot(state);
  const scene = useThree((state) => state.scene);
  return (
    <>
      {snap.current && (
        <TransformControls
          object={scene.getObjectByName(snap.current)}
          mode={modes[snap.mode]}
        />
      )}
      <OrbitControls
        makeDefault
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 1.75}
      />
    </>
  );
}

export default function App() {
  return (
    <>
          <div
        onClick={() => {
          setPlaySound(!playSound);
        }}
        style={{ width: '10vw', height: '10vh', backgroundColor: '#ff00ff' }}
      >
        OLEEEEEE
      </div>
    <Canvas camera={{ position: [0, -10, 80], fov: 50 }} dpr={[1, 2]}>
      <pointLight position={[100, 100, 100]} intensity={0.8} />
      <hemisphereLight
        color='#ffffff'
        groundColor='#b9b9b9'
        position={[-7, 25, 13]}
        intensity={0.85}
      />
      <Suspense fallback={null}>
        <group position={[0, 10, 0]}>
          <Model
            name='Curly'
            position={[1, -11, -20]}
            rotation={[2, 0, -0]}
            url={'/09_LeadVox.mp3'}
            distance={2}
          />
          <Model
            name='DNA'
            position={[20, 0, -17]}
            rotation={[1, 1, -2]}
            url={'/05_Bass.mp3'}
            distance={2}
          />
          <Model
            name='Headphones'
            position={[20, 2, 4]}
            rotation={[1, 0, -1]}
            url={'/06_ElecGtr1.mp3'}
            distance={2}
            // playSound={playSound}
            // ready={ready}
          />
          <Model
            name='Notebook'
            position={[-21, -15, -13]}
            rotation={[2, 0, 1]}
            url={'/07_ElecGtr2.mp3'}
            distance={2}
          />
          <Model
            name='Rocket003'
            position={[18, 15, -25]}
            rotation={[1, 1, 0]}
            url={'/01_Kick.mp3'}
            distance={2}
          />
          <Model
            name='Roundcube001'
            position={[-25, -4, 5]}
            rotation={[1, 0, 0]}
            scale={0.5}
            url={'/02_Snare.mp3'}
            distance={2}
          />
          <Model
            name='Table'
            position={[1, -4, -28]}
            rotation={[1, 0, -1]}
            scale={0.5}
            url={'/03_Hat.mp3'}
            distance={2}
          />
          <Model
            name='VR_Headset'
            position={[7, -15, 28]}
            rotation={[1, 0, -1]}
            scale={5}
            url={'/04_Claps.mp3'}
            distance={2}
          />
          <Model
            name='Zeppelin'
            position={[-20, 10, 10]}
            rotation={[3, -1, 3]}
            scale={0.005}
            url={'/08_ElecGtr3.mp3'}
            distance={2}
          />
          <ContactShadows
            rotation-x={Math.PI / 2}
            position={[0, -35, 0]}
            opacity={0.25}
            width={200}
            height={200}
            blur={1}
            far={50}
          />
        </group>
      </Suspense>
      <Controls />
    </Canvas></>
  );
}
