import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls, useGLTF } from '@react-three/drei';
import { Perf } from 'r3f-perf';
import { nanoid } from 'nanoid';
import './App.css';
import ImportMenu from './ImportMenu';
import MultitrackDisplay from './MultitrackDisplay';
import { Controls, ObjSound } from './ObjControls';
import { Drumkit } from './instruments/Drumkit';
import EnvComp from './EnvComp';

export default function App() {
  const { scene: drumScene } = useGLTF('/drumkitpartedOPT.glb');

  // grab only the Group children
  const allGroups = useMemo(
    () => drumScene.children.filter((c) => c.type === 'Group'),
    [drumScene]
  );

  // create or get a single AudioContext
  // const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
  // const audioCtx = useMemo(() => new AudioCtxClass(), []);
  const listener = useMemo(() => new THREE.AudioListener(), []);
  const audioCtx = listener.context;
  const [tracks, setTracks] = useState([]);
  const [playing, setPlaying] = useState(false);
  const sourcesRef = useRef([]);
  const [leftDelayTime, setLeftDelayTime] = useState(0.04118);
  const [rightDelayTime, setRightDelayTime] = useState(0.04181);
  const [hpfFreq, setHpfFreq] = useState(200);
  const [lpfFreq, setLpfFreq] = useState(6500);

  const splitter = useMemo(() => audioCtx.createChannelSplitter(2), [audioCtx]);
  const leftDelayNode = useMemo(() => audioCtx.createDelay(1.0), [audioCtx]);
  const rightDelayNode = useMemo(() => audioCtx.createDelay(1.0), [audioCtx]);
  const merger = useMemo(() => audioCtx.createChannelMerger(2), [audioCtx]);

  const convolver = useMemo(() => audioCtx.createConvolver(), [audioCtx]);
  const reverbGain = useMemo(() => {
    const g = audioCtx.createGain();
    g.gain.value = 0; // default wet level
    return g;
  }, [audioCtx]);
  const reverbHighPass = useMemo(() => {
    const f = audioCtx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 200; // default 200 Hz
    return f;
  }, [audioCtx]);
  const reverbLowPass = useMemo(() => {
    const f = audioCtx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 5000; // default 5 kHz
    return f;
  }, [audioCtx]);
  // Load impulse response once and wire bus
  useEffect(() => {
    fetch('/SteinmanHall.wav')
      .then((res) => res.arrayBuffer())
      .then((buf) => audioCtx.decodeAudioData(buf))
      .then((decoded) => {
        convolver.buffer = decoded;

        convolver.connect(splitter);

        // 4) wire each channel through its own delay into the merger
        splitter.connect(leftDelayNode, 0);
        splitter.connect(rightDelayNode, 1);
        // delays -> merger channels
        leftDelayNode.connect(merger, 0, 0);
        rightDelayNode.connect(merger, 0, 1);
        // merger -> reverbGain -> destination

        // 5) merger → your reverbGain → listener
        merger.connect(reverbHighPass);
        reverbHighPass.connect(reverbLowPass);
        reverbLowPass.connect(reverbGain);
        reverbGain.connect(listener.getInput());
      })
      .catch((err) => console.error('IR load error:', err));
  }, [
    audioCtx,
    convolver,
    reverbGain,
    reverbHighPass,
    reverbLowPass,
    listener,
  ]);

  useEffect(() => {
    leftDelayNode.delayTime.setValueAtTime(leftDelayTime, audioCtx.currentTime);
  }, [leftDelayTime, leftDelayNode, audioCtx]);
  useEffect(() => {
    rightDelayNode.delayTime.setValueAtTime(
      rightDelayTime,
      audioCtx.currentTime
    );
  }, [rightDelayTime, rightDelayNode, audioCtx]);
  useEffect(() => {
    reverbHighPass.frequency.setValueAtTime(hpfFreq, audioCtx.currentTime);
  }, [hpfFreq, reverbHighPass, audioCtx]);
  useEffect(() => {
    reverbLowPass.frequency.setValueAtTime(lpfFreq, audioCtx.currentTime);
  }, [lpfFreq, reverbLowPass, audioCtx]);
  // 4) UI state for global reverb bus level
  const [busLevel, setBusLevel] = useState(0.2);
  useEffect(() => {
    reverbGain.gain.setValueAtTime(busLevel, audioCtx.currentTime);
  }, [busLevel, reverbGain, audioCtx]);

  // Add new track with default position and distance
  function handleAddTrack({ name, url, file, groupName }) {
    const groupObj = allGroups.find((g) => g.name === groupName);
    if (!groupObj) return;


     const newSub = {
    id:    nanoid(),     // ← unique
    name,
    file,
    url,
    sendLevel: 0,
    volume:    1,
  };

  console.log(newSub)
    setTracks((prev) => {
      const idx = prev.findIndex((t) => t.group === groupObj);
      if (idx >= 0) {
        // append a new mic to existing mesh
        const next = [...prev];
        next[idx].subs.push(newSub);
        return next;
      } else {
        // brand new mesh + first mic
        const angle = (prev.length / 5) * Math.PI * 2;
        const dist = 10 + prev.length * 5;
        const defPos = [Math.cos(angle) * dist, 0, Math.sin(angle) * dist];
        return [
          ...prev,
          {
            group: groupObj,
            defPos,
            dist,
            subs: [newSub],
          },
        ];
      }
    });
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

const flatIndexMap = useMemo(() => {
  let acc = [];
  tracks.forEach((trackBucket, meshIdx) => {
    trackBucket.subs.forEach((sub, subIdx) => {
   
     acc.push({ meshIdx, subIdx,  id: sub.id ?? `${meshIdx}-${subIdx}`, });
    });
  });
  return acc;
}, [tracks]);


  const flatTracks = flatIndexMap.map(({ meshIdx, subIdx, id }) => {
  const s = tracks[meshIdx].subs[subIdx];
  // console.log(id)
  return { id, name: s.name, file: s.file, url: s.url };
});
// 3) handle delete
function handleDelete(flatIdx) {
  const { meshIdx, subIdx } = flatIndexMap[flatIdx];

  // 1) remove from your state
  setTracks((prev) => {
    const clone = [...prev];
    clone[meshIdx].subs = clone[meshIdx].subs.filter((_, i) => i !== subIdx);
    if (clone[meshIdx].subs.length === 0) clone.splice(meshIdx, 1);
    return clone;
  });

  // 2) force all <Sound> to stop, then restart the survivors
  setPlaying(false);
  // next tick, turn it back on
  setTimeout(() => setPlaying(true), 0);
}



// 4) handle reassignment
function handleReassign(flatIdx, newGroupName) {
  const { meshIdx, subIdx } = flatIndexMap[flatIdx];
  const newGroup = allGroups.find((g) => g.name === newGroupName);
  if (!newGroup) return;
  setTracks((prev) => {
    const clone = [...prev];
    // remove sub from old bucket
    const [subObj] = clone[meshIdx].subs.splice(subIdx, 1);
    // if old bucket empty, drop it
    if (clone[meshIdx].subs.length === 0) {
      clone.splice(meshIdx, 1);
    }
    // find or create new bucket for newGroup
    let targetIdx = clone.findIndex((t) => t.group === newGroup);
    if (targetIdx < 0) {
      const angle    = (clone.length / 5) * Math.PI * 2;
      const distance = 10 + clone.length * 5;
      const defPos   = [
        Math.cos(angle) * distance,
        0,
        Math.sin(angle) * distance,
      ];
      clone.push({ group: newGroup, defPos, dist: distance, subs: [] });
      targetIdx = clone.length - 1;
    }
    // add sub into its new bucket
    clone[targetIdx].subs.push(subObj);
    return clone;
  });
}

// 5) render


  return (
    <>
      {' '}
      <div className='rev-params'>
        <div style={{ margin: '1em 0' }}>
          <button onClick={playAll} style={{ marginRight: '0.5em' }}>
            ▶️ Play All
          </button>
          <button onClick={stopAll}>⏹ Stop All</button>
        </div>
        <div style={{ margin: '1em 0' }}>
          <label>Reverb Bus Level:</label>
          <input
            type='range'
            min={0}
            max={2}
            step={0.01}
            value={busLevel}
            onChange={(e) => setBusLevel(parseFloat(e.target.value))}
          />
        </div>

        <div style={{ margin: '1em 0' }} className='param'>
          <label>Left Delay (ms): {leftDelayTime}</label>
          <input
            type='range'
            min={0}
            max={0.2}
            step={0.00001}
            value={leftDelayTime}
            onChange={(e) => setLeftDelayTime(parseFloat(e.target.value))}
          />
        </div>
        <div style={{ margin: '1em 0' }} className='param'>
          <label>Right Delay (ms): {rightDelayTime}</label>
          <input
            type='range'
            min={0}
            max={0.2}
            step={0.00001}
            value={rightDelayTime}
            onChange={(e) => setRightDelayTime(parseFloat(e.target.value))}
          />
        </div>
        <div style={{ margin: '1em 0' }} className='param'>
          <label>Reverb Low-Cut (Hz): {hpfFreq}</label>
          <input
            type='range'
            min={20}
            max={2000}
            step={1}
            value={hpfFreq}
            onChange={(e) => setHpfFreq(parseFloat(e.target.value))}
          />
        </div>
        <div style={{ margin: '1em 0' }} className='param'>
          <label>Reverb High-Cut (Hz): {lpfFreq}</label>
          <input
            type='range'
            min={500}
            max={20000}
            step={100}
            value={lpfFreq}
            onChange={(e) => setLpfFreq(parseFloat(e.target.value))}
          />
        </div>
      </div>
      <MultitrackDisplay tracks={flatTracks} width={500} height={30}      groupNames={allGroups.map((g) => g.name)}
      onDelete={handleDelete}
      onReassign={handleReassign}/>
      <ImportMenu
        onAdd={handleAddTrack}
        groupNames={allGroups.map((g) => g.name)}
      />
      <Canvas camera={{ position: [0, 5, 20], fov: 35 }} dpr={[1, 2]} shadows>
        <pointLight position={[5, 10, 5]} intensity={1} castShadow />
        <ambientLight intensity={0.3} />

        <Suspense fallback={null}>
          <group>
            {tracks.map((t, i) => (
              <ObjSound
                key={t.name + t.url}
                name={t.name}
                url={t.url}
                file={t.file}
                defPos={t.defPos}
                dist={t.dist}
                on={playing}
                group={t.group}
                audioCtx={audioCtx}
                listener={listener}
                convolver={convolver}
                subs={t.subs}
                onSubsChange={(newSubs) => {
                  setTracks((prev) => {
                    const copy = [...prev];
                    copy[i].subs = newSubs;
                    return copy;
                  });
                }}
              />
            ))}
          </group>
        </Suspense>
        {/* <Drumkit scale={5}/> */}
        {/* <ambientLight intensity={10}/> */}
        <EnvComp />
        <Controls />
        <Perf deepAnalyze />
      </Canvas>
    </>
  );
}
