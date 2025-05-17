import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  TransformControls,
  ContactShadows,
  Text,
  Html,
  Effects,
} from '@react-three/drei';
import { proxy, useSnapshot } from 'valtio';
import * as THREE from 'three';
import './App.css';

import Sound from './Sound';
import EnvComp from './EnvComp';
import { Bloom, EffectComposer, N8AO } from '@react-three/postprocessing';
import { Perf } from 'r3f-perf';
import { Bass } from './instruments/Bass';
import { Drums } from './instruments/Drums';
import ImportMenu from './ImportMenu';
import MultitrackDisplay from './MultitrackDisplay';


const modes = ['translate', 'rotate', 'scale'];
const state = proxy({ current: null, mode: 0 });

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

function ObjSound(props) {
  const [paused, setPaused] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const snap = useSnapshot(state);
  const meshRef = useRef();
  const [mainVol, setMainVol] = useState(0.5);
  // console.log(meshRef)
  return (
    <mesh
      position={props.defPos}
      name={props.name}
      onDoubleClick={() => setPaused(!paused)}
      onClick={(e) => (e.stopPropagation(), (state.current = props.name))}
      onContextMenu={(e) => (
        e.stopPropagation(),
        snap.current === props.name &&
          (state.mode = (snap.mode + 1) % modes.length)
      )}
    >
      {/* <mesh> */}
      {/* {(props.name === "drums") ? (
  <group  >

  <Drums  />
  </group>
):

(props.name === "bass") ? ( <group  >

  <Bass />
  </group>)
  :
( */}
      <mesh
        ref={meshRef}
        position={[0, volume *5, 0]}
        visible={true}
        castShadow
        receiveShadow
        scale={volume*10}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={'#ff00ff'}
          emissive={'#000000'}
          roughness={0.5}
          metalness={0.51}
        />
      </mesh>
      <Html center position={[0,1,0]}>
        <div
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            background: 'rgba(0,0,0,0.6)',
            padding: '4px',
            borderRadius: '4px',
          }}
        >
          <label style={{ color: 'white', fontSize: '0.7em' }}>
            {props.name}
          </label>
          <input
            type='range'
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
          />
        </div>
      </Html>

      <Sound
        meshRef={meshRef}
        name={props.name}
        on={props.on}
        paused={paused}
        volume={volume}
        dist={props.dist}
        delayTime={props.delay}
        url={props.url}
        mainVol={mainVol}
        playTrigger={props.playTrigger}
        globalPlay={props.globalPlay}
      />
    </mesh>
  );
}

export default function App() {
  const audioCont = new THREE.AudioContext();
  const [on, setOn] = useState(false);
  const [dTime, setDTime] = useState(0);
  const [tracks, setTracks] = useState([]);
  const sourcesRef = useRef([]);
  const [playTrigger, setPlayTrigger] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  
  function handleAddTrack(track) {
    // auto-position tracks in a circle
    const angle = (tracks.length / 5) * Math.PI * 2;
    const distance = 10 + tracks.length * 5;
    const defPos = [
      Math.cos(angle) * distance,
      0,
      Math.sin(angle) * distance,
    ];
    setTracks([
      ...tracks,
      {
        ...track,
        dist: distance,
        defPos,
        delay: dTime,
      },
    ]);
  }

  const handlePlayAll = () => {
    setIsPlaying(true);
    // bump the trigger so every Sound useEffect will re-run
    setPlayTrigger(n => n + 1);
  };

  // Fire when user clicks “Stop All”
  const handleStopAll = () => {
    setIsPlaying(false);
    // bump trigger so we can also reset on stop
    setPlayTrigger(n => n + 1);
  };
  return (
    <>
    <MultitrackDisplay tracks={tracks} width={500} height={80}/>
    <div style={{ marginBottom: '1em' }}>
        <button onClick={handlePlayAll} style={{ marginRight: '0.5em' }}>
          ▶️ Play All
        </button>
        <button onClick={handleStopAll}>⏹ Stop All</button>
      </div>
        
          <ImportMenu onAdd={handleAddTrack} />
      <div
        onDoubleClick={() => setOn(!on)}
        style={{ width: '10vw', height: '10vh', backgroundColor: '#ff00ff' }}
      >
        Play / Pause (dbl click)
      </div>

      <Canvas camera={{ position: [0, 5, 20], fov: 35 }} dpr={[1, 2]} shadows>
        <pointLight position={[5, 10, 5]} intensity={50.8} castShadow />

        {/* <Stage> */}

        <EnvComp />

        <Suspense fallback={null}>
          <group position={[0, 0, 0]}>
          {tracks.map((t) => (
              <ObjSound
                key={t.name + t.url}
                name={t.name}
                file={t.file}
                url={t.url}
                dist={t.dist}
                defPos={t.defPos}
                context={audioCont}
                on={on}
                delay={t.delay}
                instrument={t.instrument}
                stereo={t.isStereo}
                playTrigger={playTrigger}
                globalPlay={isPlaying}
              />
            ))}
          </group>
        </Suspense>
        {/* <EffectComposer disableNormalPass >
            <N8AO
              halfRes
              color='black'
              aoRadius={2}
              intensity={1}
              aoSamples={6}
              denoiseSamples={4}
            />
     <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} intensity={2}/>
          </EffectComposer> */}

        {/* </Stage> */}
        <Controls />
        <Perf deepAnalyze />
      </Canvas>
    </>
  );
}
