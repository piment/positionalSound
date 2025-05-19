import { Suspense, useEffect, useMemo, useRef, useState } from 'react';

import * as THREE from 'three';
import './App.css';

import ImportMenu from './ImportMenu';
import MultitrackDisplay from './MultitrackDisplay';
import { useAudioContext } from './AudioContextProvider';
import MasterControls from './MasterControls';
import ObjSound from './ObjSound';
import Scene from './Scene';

export default function App() {
  const audioCont = new THREE.AudioContext();
  const audioCtx = useAudioContext();
  const [on, setOn] = useState(false);
  const [dTime, setDTime] = useState(0);
  const [tracks, setTracks] = useState([]);
  const sourcesRef = useRef([]);
  const [playTrigger, setPlayTrigger] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reverbNode] = useState(() => audioCtx.createConvolver());
  const [reverbReturnGain] = useState(() => audioCtx.createGain());

  const masterGain = useMemo(() => audioCtx.createGain(), [audioCtx]);
  const masterMeter = useMemo(() => audioCtx.createAnalyser(), [audioCtx]);
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
  useEffect(() => {
    // chain: masterGain → masterMeter → destination
    masterGain.connect(audioCtx.destination);
    masterMeter.connect(audioCtx.destination);

    // init at unity gain
    masterGain.gain.setValueAtTime(1, audioCtx.currentTime);

    // no cleanup: we want the master bus alive for the life of the app
  }, [audioCtx, masterGain, masterMeter]);

  const handlePlayAll = () => {
    setIsPlaying(true);
    // bump the trigger so every Sound useEffect will re-run
    setPlayTrigger((n) => n + 1);
  };

  // Fire when user clicks “Stop All”
  const handleStopAll = () => {
    setIsPlaying(false);
    // bump trigger so we can also reset on stop
    setPlayTrigger((n) => n + 1);
  };

  useEffect(() => {
    // hook up reverb bus into master
    reverbNode.connect(reverbReturnGain);
    reverbReturnGain.connect(masterGain);

    // load the IR file
    fetch('/reverb0_55-4-15000-1000.wav')
      .then((res) => res.arrayBuffer())
      .then((arr) => audioCtx.decodeAudioData(arr))
      .then((buffer) => {
        reverbNode.buffer = buffer;
      })
      .catch((err) => console.error('Failed to load IR:', err));
  }, [audioCtx, reverbNode, reverbReturnGain]);

  return (
    <>
      <MasterControls
        audioCtx={audioCtx}
        masterGain={masterGain}
        analyser={masterMeter}
      />
      <MultitrackDisplay tracks={tracks} width={500} height={80} />
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

      <Scene
        tracks={tracks}
        globalPlay={isPlaying}
        playTrigger={playTrigger}
        masterGain={masterGain}
        reverbNode={reverbNode}
      />
    </>
  );
}
