import { Suspense, useEffect, useMemo, useRef, useState } from 'react';

import * as THREE from 'three';
import './App.css';

import ImportMenu from './ImportMenu';
import MultitrackDisplay from './MultitrackDisplay';
import { useAudioContext } from './AudioContextProvider';
import { Canvas, useThree } from '@react-three/fiber';
import { Perf } from 'r3f-perf';
import { OrbitControls, TransformControls } from '@react-three/drei';
import EnvComp from './EnvComp';
import { Html, Effects } from '@react-three/drei';
import { proxy, useSnapshot } from 'valtio';
import Sound from './Sound';

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
      />
    </mesh>
  );
}

export default function App() {
  const audioCont = new THREE.AudioContext();
  const audioCtx = useAudioContext();
  const [on, setOn] = useState(false);
  const [dTime, setDTime] = useState(0);
  const [tracks, setTracks] = useState([]);
  const sourcesRef = useRef([]);

  
  function handleAddTrack(track) {
    // auto-position tracks in a circle
    const angle = (tracks.length / 5) * Math.PI * 2;
    const distance = 10 + tracks.length * 5;
    const defPos = [Math.cos(angle) * distance, 0, Math.sin(angle) * distance];
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
  return (
    <>
    <MultitrackDisplay tracks={tracks} width={500} height={80}/>
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
