import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls } from '@react-three/drei';
import { Perf } from 'r3f-perf';
import { Html } from '@react-three/drei';
import { proxy, useSnapshot } from 'valtio';

import './App.css';
import ImportMenu from './ImportMenu';
import MultitrackDisplay from './MultitrackDisplay';
import Sound from './Sound';

// global scene state for transform controls
const modes = ['translate', 'rotate', 'scale'];
const sceneState = proxy({ current: null, mode: 0 });

function Controls() {
  const snap = useSnapshot(sceneState);
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

function ObjSound({ name, defPos, url, dist, audioCtx, on }) {
  const meshRef = useRef();
  const [paused, setPaused] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [width,  setWidth]  = useState(1);
  const snap = useSnapshot(sceneState);

  return (
    <mesh
      ref={meshRef}
      position={defPos}
      name={name}
      onDoubleClick={() => setPaused((p) => !p)}
      onClick={(e) => {
        e.stopPropagation();
        sceneState.current = name;
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        if (snap.current === name) {
          sceneState.mode = (snap.mode + 1) % modes.length;
        }
      }}
    >
      {/* Visual indicator: cube scaled by volume */}
      <mesh position={[0, volume * 5, 0]} scale={volume * 10} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ff00ff" />
      </mesh>

      {/* HTML slider for volume control */}
      <Html center position={[0, 1, 0]}>  
          <div onPointerDown={e => e.stopPropagation()} 
             style={{ background: 'rgba(0,0,0,0.6)', padding:'4px', borderRadius:'4px' }}>
          <label style={{ color:'white', fontSize:'0.7em' }}>width</label>
          <input
            type="range"
            min={0} max={1} step={0.01}
            value={width}
            onChange={e => setWidth(parseFloat(e.target.value))}
          />
        </div>
        <div
          onPointerDown={(e) => e.stopPropagation()}
          style={{ background: 'rgba(0,0,0,0.6)', padding: '4px', borderRadius: '4px' }}
        >
          <label style={{ color: 'white', fontSize: '0.7em' }}>{name}</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
          />
        </div>
      </Html>

      {/* Positional audio component */}
      <Sound
        meshRef={meshRef}
        url={url}
        dist={dist}
        volume={volume}
        on={on}
        width={width}
        paused={paused}
        audioCtx={audioCtx}
      />
    </mesh>
  );
}

export default function App() {
  // create or get a single AudioContext
  const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
  const audioCtx = useMemo(() => new AudioCtxClass(), []);

  const [tracks, setTracks] = useState([]);
  const [playing, setPlaying] = useState(false);
  const sourcesRef = useRef([]);

  // Add new track with default position and distance
  function handleAddTrack(track) {
    const angle = (tracks.length / 5) * Math.PI * 2;
    const distance = 10 + tracks.length * 5;
    const defPos = [Math.cos(angle) * distance, 0, Math.sin(angle) * distance];
    setTracks((prev) => [...prev, { ...track, defPos, dist: distance }]);
  }

  // decode ArrayBuffer via native AudioContext
  const decodeBuffer = (file) =>
    file.arrayBuffer().then((buffer) => audioCtx.decodeAudioData(buffer));

  async function playAll() {
    // if (!tracks.length) return;
    // // stop existing sources
    // sourcesRef.current.forEach((src) => src.stop());
    // sourcesRef.current = [];

    // // decode and schedule all
    // const buffers = await Promise.all(tracks.map((t) => decodeBuffer(t.file)));
    // buffers.forEach((buffer) => {
    //   const src = audioCtx.createBufferSource();
    //   src.buffer = buffer;
    //   src.connect(audioCtx.destination);
    //   sourcesRef.current.push(src);
    // });
    // const startTime = audioCtx.currentTime + 0.05;
    // sourcesRef.current.forEach((src) => src.start(startTime));
    setPlaying(true);
  }

  function stopAll() {
    sourcesRef.current.forEach((src) => src.stop());
    sourcesRef.current = [];
    
    setPlaying(false);
  }

  return (
    <>
      <div style={{ margin: '1em 0' }}>
        <button onClick={playAll} style={{ marginRight: '0.5em' }}>
          ▶️ Play All
        </button>
        <button onClick={stopAll}>⏹ Stop All</button>
      </div>

      <MultitrackDisplay tracks={tracks} width={500} height={80} />
      <ImportMenu onAdd={handleAddTrack} />

      <Canvas camera={{ position: [0, 5, 20], fov: 35 }} dpr={[1, 2]} shadows>
        <pointLight position={[5, 10, 5]} intensity={1} castShadow />
        <ambientLight intensity={0.3} />

        <Suspense fallback={null}>
          <group>
            {tracks.map((t) => (
              <ObjSound
                key={t.name + t.url}
                name={t.name}
                url={t.url}
                file={t.file}
                defPos={t.defPos}
                dist={t.dist}
                on={playing}
                audioCtx={audioCtx}
              />
            ))}
          </group>
        </Suspense>

        <Controls />
        <Perf deepAnalyze />
      </Canvas>
    </>
  );
}
