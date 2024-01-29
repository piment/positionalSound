import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  useGLTF,
  PositionalAudio,
  OrbitControls,
  Grid,
  TransformControls,
  useCursor,
} from '@react-three/drei';
import './App.css';
import { proxy, useSnapshot } from 'valtio';

const modes = ['translate', 'rotate', 'scale'];
const state = proxy({ current: null, mode: 0 });

export default function App({ ready }) {
  const [paused, setPaused] = useState(false);
  const [playSound, setPlaySound] = useState(false);

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
      <Canvas camera={{ position: [0, 1, 2], fov: 45, far: 10000 }}>
        {/* <fog attach="fog" args={['#cc7b32', 0, 500]} /> */}
        {/* <OrbitControls enableDamping={false} enablePan={false} enableRotate={!false}/> */}

        <Model
          ready={ready}
          playSound={playSound}
          setPlaySound={setPlaySound}
        />
      </Canvas>
    </>
  );
}

function Controls() {
  // Get notified on changes to state
  const snap = useSnapshot(state);
  const scene = useThree((state) => state.scene);
  console.log(scene.getObjectByName(snap.current));
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

function Model({ ready, playSound, setPlaySound, name, ...props }) {
  // const group = useRef()
  // const { nodes, materials } = useGLTF('/scene-draco.glb');
  // const { nodes, materials } = 'audio_ae'
  // useFrame(() => (group.current.rotation.y += 0.003))

  const snap = useSnapshot(state);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);



  function Track({
    position,
    args,
    color,
    url,
    distance,
    playSound,
    ready,
    name,
    ...props
  }) {
    const [clicked, click] = useState(false);
    const trackRef = useRef();
    const [scalus, setScalus] = useState(false);

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
      // <group>


        <mesh
          name={name}
          position={position}
          onClick={(e) => (e.stopPropagation(), (state.current = name))}
          onContextMenu={(e) =>
            snap.current === name &&
            (e.stopPropagation(), (state.mode = (snap.mode + 1) % modes.length))
          }
          onPointerOver={(e) => (e.stopPropagation(), setHovered(true))}
          onPointerOut={(e) => setHovered(false)}

          {...props}
          dispose={null}
        >
          <boxGeometry args={args} />
          <meshBasicMaterial color={scalus ? '#000' : color} />
       
        {/* {ready && ( */}
        <PositionalAudio
          ref={trackRef}
          // play={!clicked}
          // connect={true}
          // isPlaying={playSound ? true : false}
          autoplay={true}
          // pause={!playSound ? false : true}
          loop
          url={url}
          distance={distance}
        />
        {/* )} */}
 </mesh>
      // </group>
    );
  }

  return (
    <> <Controls />
    <group position={[0,0,0]}>

     
      <Track
        name='gtr1'
        position={[10, 1, 0]}
        args={[3, 3, 3]}
        color={'#ff00ff'}
        url={'/06_ElecGtr1.mp3'}
        distance={2}
        playSound={playSound}
        ready={ready}
        />
      <Track
        name='gtr2'
        position={[-10, 1, 0]}
        args={[3, 3, 3]}
        color={'#00ffff'}
        url={'/07_ElecGtr2.mp3'}
        distance={2}
        playSound={playSound}
        ready={ready}
        />
      <Track
        name='kick'
        position={[0, 1, -10]}
        args={[3, 3, 3]}
        color={'#00ff00'}
        url={'/01_Kick.mp3'}
        distance={2}
        playSound={playSound}
        ready={ready}
        />
      <Track
        name='snare'
        position={[-4, 2, -6]}
        args={[3, 3, 3]}
        color={'#00ff00'}
        url={'/02_Snare.mp3'}
        distance={2}
        playSound={playSound}
        ready={ready}
        />
      <Track
        position={[0, -2, -6]}
        args={[3, 3, 3]}
        color={'#0cffe0'}
        url={'/03_Hat.mp3'}
        distance={2}
        playSound={playSound}
        ready={ready}
        />
      <Track
        position={[-4, -2, -1]}
        args={[3, 3, 3]}
        color={'#00ca00'}
        url={'/04_Claps.mp3'}
        distance={2}
        playSound={playSound}
        ready={ready}
        />
      <Track
        position={[0, -2, -1]}
        args={[3, 3, 3]}
        color={'#00ff00'}
        url={'/08_ElecGtr3.mp3'}
        distance={2}
        playSound={playSound}
        ready={ready}
        />
      <Track
        name='vox'
        position={[0, -2, -1]}
        args={[3, 3, 3]}
        color={'#00ff00'}
        url={'/09_LeadVox.mp3'}
        distance={2}
        playSound={playSound}
        ready={ready}
        />
      <Track
        name='bass'
        position={[0, 0, 3]}
        args={[3, 3, 3]}
        color={'#ffff00'}
        url={'/05_Bass.mp3'}
        distance={2}
        playSound={playSound}
        ready={ready}
        />
        </group>
      <Grid />
    </>
  );
}
