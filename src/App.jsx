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
import Sound from './Sound';
import DrumKitCanvas from './DrumKitCanvas';

export default function App() {
  // const { scene: drumScene } = useGLTF('/drumkitpartedOPT.glb');

  // // grab only the Group children
  // const allGroups = useMemo(
  //   () => drumScene.children.filter((c) => c.type === 'Group'),
  //   [drumScene]
  // );
  const { scene } = useGLTF('/drumkitpartedOPT.glb');

    const allParts = useMemo(
    () => scene.children.filter((c) => c.type === 'Group').map((g) => g.name),
    [scene]
  );

  // create or get a single AudioContext
  // const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
  // const audioCtx = useMemo(() => new AudioCtxClass(), []);
  const listener = useMemo(() => new THREE.AudioListener(), []);
  const audioCtx = listener.context;
  const [tracks, setTracks] = useState([]);
  const [playing, setPlaying] = useState(false);
  const sourcesRef = useRef([]);
  const drumRef = useRef(null)


  const [meshes, setMeshes]           = useState([]);  // e.g. ['snare','kick']
  const [trackList, setTrackList]     = useState([]);  // flat tracks: {id,name,file,url}
  const [assignments, setAssignments] = useState({});  // { meshName: [trackId,…], null: [trackId,…] }

const [selectedPart, setSelectedPart] = useState([])

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
      id: nanoid(), // ← unique
      name,
      file,
      url,
      sendLevel: 0,
      volume: 1,
    };

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
  // function addMesh(partName) {
  //   if (!meshes.includes(partName)) setMeshes((m) => [...m, partName]);
  // }
    const addMesh = (name) => setMeshes((m) => m.includes(name) ? m : [...m, name]);

  // decode ArrayBuffer via native AudioContext
  const decodeBuffer = (file) =>
    file.arrayBuffer().then((buffer) => audioCtx.decodeAudioData(buffer));


function handleImport(items) {
  // build full track objects
  const newTracks = items.map((f) => ({
    id:        nanoid(),
    file:      f.file,
    url:       f.url,
    name:      f.name,
    volume:    1,
    sendLevel: 0,
  }));

  // optionally keep a flat list too
  setTrackList((prev) => [...prev, ...newTracks]);

  // **seed unassigned with the objects themselves**—
  // not with newTracks.map(t => t.id)
  setAssignments((a) => ({
    ...a,
    null: [...(a.null || []), ...newTracks],
  }));
}
function toggleAssign(trackObj, targetMesh) {
  setAssignments((prev) => {
    // remove from every bucket
    const cleaned = Object.fromEntries(
      Object.entries(prev).map(([mesh, arr]) => [
        mesh,
        arr.filter((t) => t.id !== trackObj.id),
      ])
    );
    // add to target mesh
    return {
      ...cleaned,
      [targetMesh]: [...(cleaned[targetMesh] || []), trackObj],
    };
  });
}
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
        acc.push({ meshIdx, subIdx, id: sub.id ?? `${meshIdx}-${subIdx}` });
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


  // 5) render

  return (
    <div style={{  height:'100vh' }}>
    <div className='rev-params'>
        <div style={{ margin: '1em 0', zIndex: '20' }}>
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

      {/* Left: Parts palette */}
      <div style={{ width:200, borderRight:'1px solid #333' }} className='panel-left'>
        {allParts.map((p) => (
          <button
            key={p}
            onClick={() => addMesh(p)}
            disabled={meshes.includes(p)}
          >
            {meshes.includes(p) ? 'Added' : 'Add'} {p}
          </button>
        ))}
      </div>

      {/* Center: 3D canvas */}
      <div style={{ flex:1 }} className='canvas-main'>
      <Canvas camera={{ position: [0, 5, 20], fov: 35 }} dpr={[1, 2]} shadows>
          <ambientLight intensity={0.3}/>
          <pointLight position={[5,10,5]} intensity={1}/>
<Drumkit
    ref={drumRef}
    scale={5}
    hiddenParts={meshes}          // array of part-names you’ve already spawned
    onSelect={(partName) => addMesh(partName)}
  /> 
{/*
  <Suspense fallback={null}>
    {meshes.map((part) => {
      // grab the original group from the GLTF scene
      const originalGroup = drumRef.current.getObjectByName(part)
      const pos = new THREE.Vector3()
      originalGroup.getWorldPosition(pos)

      // your full track-object array for that part
      const subs = assignments[part] || []

      return (
        <ObjSound
          key={part}
          name={part}
          group={originalGroup}
          defPos={[pos.x, pos.y, pos.z]}
          subs={subs}
          on={playing}
          listener={listener}
          convolver={convolver}
          selected={selectedPart === part}
          onSelect={() => setSelectedPart(part)}
          onSubsChange={(newSubs) =>
            setAssignments((a) => ({ ...a, [part]: newSubs }))
          }
        />
      )
    })}
*/}

  {(assignments.null || []).map((sub) => (
      <ObjSound
        key={sub.id}
        name={sub.name}
        defPos={[0, 0, 0]}
        subs={[sub]}
        on={playing}
        listener={listener}
        convolver={convolver}
        selected={selectedPart === null}
        onSelect={() => setSelectedPart(null)}
        onSubsChange={(newSubs) =>
          setAssignments((a) => ({ ...a, null: newSubs }))
        }
      />
    ))} 
    {/* </Suspense> */}

  <Suspense>
    <DrumKitCanvas
      meshes={meshes}
            assignments={assignments}
            playing={playing}
            listener={listener}
            convolver={convolver}
            selectedPart={selectedPart}
            setSelectedPart={setSelectedPart}
            setAssignments={setAssignments}
            />
  </Suspense>

          <EnvComp />
        <Controls />
        <Perf deepAnalyze />
        </Canvas>
      </div>

      {/* Right: Track list & assignment UI */}
      <div style={{ width:200, borderLeft:'1px solid #333' }} className='panel-right'>
        <ImportMenu onAdd={handleImport} />

        <h4>Tracks</h4>
      {trackList.map((t) => (
  <div key={t.id}>
    {t.name}
    <select
      value={
        // find which bucket it lives in, or 'null'
        Object.entries(assignments)
          .find(([, arr]) => arr.some((x) => x.id === t.id))?.[0] ||
        'null'
      }
      onChange={(e) => toggleAssign(t, e.target.value)}
    >
      <option value="null">Unassigned</option>
      {meshes.map((m) => (
        <option key={m} value={m}>{m}</option>
      ))}
    </select>
  </div>
))}
      </div>
    </div>
  );
}
