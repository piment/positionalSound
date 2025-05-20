import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls } from '@react-three/drei';
import { Perf } from 'r3f-perf';


import './App.css';
import ImportMenu from './ImportMenu';
import MultitrackDisplay from './MultitrackDisplay';
import { Controls, ObjSound } from './ObjControls';




export default function App() {
  // create or get a single AudioContext
  // const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
  // const audioCtx = useMemo(() => new AudioCtxClass(), []);
  const listener = useMemo(() => new THREE.AudioListener(), []);
  const audioCtx = listener.context
  const [tracks, setTracks] = useState([]);
  const [playing, setPlaying] = useState(false);
  const sourcesRef = useRef([]);


 const convolver = useMemo(() => audioCtx.createConvolver(), [audioCtx]);
  const reverbGain = useMemo(() => {
    const g = audioCtx.createGain();
    g.gain.value = 0; // default wet level
    return g;
  }, [audioCtx]);

  // Load impulse response once and wire bus
  useEffect(() => {
    fetch('/SteinmanHall.wav')
      .then((res) => res.arrayBuffer())
      .then((buf) => audioCtx.decodeAudioData(buf))
      .then((decoded) => {
        convolver.buffer = decoded;
        // connect convolver -> reverbGain -> listener input
        convolver.connect(reverbGain);
        reverbGain.connect(listener.getInput());
      })
      .catch((err) => console.error('IR load error:', err));
  }, [audioCtx, convolver, reverbGain, listener]);

  // 4) UI state for global reverb bus level
  const [busLevel, setBusLevel] = useState(0.2);
  useEffect(() => {
    reverbGain.gain.setValueAtTime(busLevel, audioCtx.currentTime);
  }, [busLevel, reverbGain, audioCtx]);
  
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
        <div style={{ margin: '1em 0' }}>
        <label>Reverb Bus Level:</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={busLevel}
          onChange={(e) => setBusLevel(parseFloat(e.target.value))}
        />
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
                listener={listener}
                  convolver={convolver}
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
