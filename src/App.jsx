import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { Perf } from 'r3f-perf';
import { nanoid } from 'nanoid';
import './App.css';
import ImportMenu from './ImportMenu';
import { Controls, ObjSound } from './ObjControls';
import EnvComp from './EnvComp';
import Sound from './Sound';
import { Kick } from './instruments/drumkit/Kick';
import { Snare } from './instruments/drumkit/Snare';
import { Hihat } from './instruments/drumkit/Hihat';
import { HiTom } from './instruments/drumkit/HiTom';
import { MidTom } from './instruments/drumkit/MidTom';
import { FloorTom } from './instruments/drumkit/FloorTom';
import { Crash } from './instruments/drumkit/Crash';
import { Ride } from './instruments/drumkit/Ride';
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  GodRays,
  Noise,
  Vignette,
} from '@react-three/postprocessing';

import { useSelector, useDispatch } from 'react-redux';
import { setMode, toggleMode }      from './reducer/viewModeSlice'
import {
  addTrack,
  removeTrack,
  toggleVisibility,
  setColor,
  setVolume,
   setSendLevel,
} from './reducer/trackSettingsSlice';
import throttle from 'lodash.throttle';
import FrequencySpectrum from './FrequencySpectrum';
import { GuitarAmp } from './instruments/amps/GuitarAmp';
import { BassAmp } from './instruments/amps/BassAmp';
import {Overheads} from './instruments/drumkit/Overheads';
import { useAudioContext, useAudioListener } from './AudioContextProvider';
import { useBufferCache } from './hooks/useBufferCache';
import TrackConsole from './TrackConsole';
import { RxMixerVertical } from "react-icons/rx";

const COMPONENTS = {
  Snare: Snare,
  Kick: Kick,
  Hihat: Hihat,
  HiTom: HiTom,
  MidTom: MidTom,
  FloorTom: FloorTom,
  Crash: Crash,
  Ride: Ride,
  Overheads :Overheads,
  Guitar : GuitarAmp,
  Bass: BassAmp
};

const STORAGE_KEYS = {
  trackList: 'myapp:trackList',
  assignments: 'myapp:assignments',
  meshes: 'myapp:meshes',
};



export default function App() {

const listener = useAudioListener();
const audioCtx = useAudioContext();

const { loadBuffer, clearBuffer, clearAllBuffers, cache } = useBufferCache(audioCtx);


 const masterTapGain  = useMemo(() => audioCtx.createGain(),    [audioCtx])
 const masterAnalyser = useMemo(() => audioCtx.createAnalyser(), [audioCtx])
 // wire them once—no destination hookup!
 useMemo(() => {
   masterTapGain.gain.value = 1
   masterTapGain.connect(masterAnalyser)
   // ──> (do *not* connect masterAnalyser to destination)
 }, [masterTapGain, masterAnalyser])


  const dispatch = useDispatch();
  const settings = useSelector((state) => state.trackSettings);
  const mode     = useSelector(state => state.viewMode)
  
  const [consoleOpen, setConsoleOpen] = useState(false);


const [playing, setPlaying] = useState(false);
const [playOffset, setPlayOffset] = useState(0);
const [pauseTime, setPauseTime] = useState(null)

  const [tracks, setTracks] = useState([]);
  const [sources, setSources] = useState([]);
  const sourcesRef = useRef([]);
  const [trackList, setTrackList] = useState([]);
  const [assignments, setAssignments] = useState({ null: [] });
const [scrubPos, setScrubPos] = useState(0);
const [mainTrackId, setMainTrackId] = useState(null);
const activeNodesRef = useRef({});


  const [meshes, setMeshes] = useState(() => {
    const v = localStorage.getItem(STORAGE_KEYS.meshes);
    return v ? JSON.parse(v) : [];
  });
  const [selectedTrackId, setSelectedTrackId] = useState(null);

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
    g.gain.value = .2; // default wet level
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.meshes, JSON.stringify(meshes));
  }, [meshes]);

  function addMesh(partName) {
    if (!meshes.includes(partName)) setMeshes((m) => [...m, partName]);
  }

 async function handleImport(items) {
  const newTracks = await Promise.all(
    items.map(async (f) => {
      const buffer = await loadBuffer(f.url);
      return {
        id: nanoid(),
        file: f.file,
        url: f.url,
        name: f.name,
        buffer,        // ✅ store preloaded buffer
        volume: 1,
        sendLevel: 0,
      };
    })
  );

  setTrackList((prev) => [...prev, ...newTracks]);

  setAssignments((a) => ({
    ...a,
    null: [...(a.null || []), ...newTracks],
  }));

  newTracks.forEach((t) => {
    dispatch(addTrack(t.id));
  });
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

// assuming COMPONENTS is in scope, e.g.
// const COMPONENTS = { Snare, Kick, … }

async function handleAutoAssign(items) {
  const newTracks = await Promise.all(
    items.map(async (f) => {
      const buffer = await loadBuffer(f.url); // ✅ preload
      return {
        id: nanoid(),
        file: f.file,
        url: f.url,
        name: f.name,
        buffer,             // ✅ store the decoded buffer
        volume: 1,
        sendLevel: 0,
      };
    })
  );

  setTrackList((prev) => [...prev, ...newTracks]);

  newTracks.forEach((t) => dispatch(addTrack(t.id)));

  // 4) bucket into assignments by name:
  setAssignments(prev => {
    // start with the old buckets
    const next = { ...prev }
    newTracks.forEach(t => {
      // find the first COMPONENT key that matches the track name
      const match = Object.keys(COMPONENTS)
        .find(key => t.name.toLowerCase().includes(key.toLowerCase()))
      const bucket = match || 'null'
      next[bucket] = [ ...(next[bucket]||[]), t ]
    })
    return next
  })
}

useEffect(() => {
  const longest = trackList.reduce((longest, track) => {
    return track.buffer?.duration > (longest?.buffer?.duration || 0) ? track : longest;
  }, null);
  if (longest?.id) setMainTrackId(longest.id);
}, [trackList]);

async function playAll() {
     await audioCtx.resume();
  const resumeOffset = pauseTime || scrubPos || 0;
  setPlayOffset(audioCtx.currentTime - resumeOffset);
  setPlaying(true);
  // setPauseTime(null); // reset pause time
}
 function pauseAll() {
 console.log(audioCtx.currentTime, playOffset)
  setPauseTime(audioCtx.currentTime - playOffset);
  console.log(audioCtx.currentTime - playOffset)
  setPlaying(false);
}
function stopAll() {
    setPauseTime(0);
  setScrubPos(0);  // ← record current play position
  setPlaying(false);
  setPlayOffset(0)
}

useEffect(() => {
  if (playing) {
    setScrubPos(audioCtx.currentTime - playOffset);
  }


}, [playing, audioCtx, playOffset]);



function updateTrack(id, props) {
  setAssignments((prev) => {
    const updated = {};
    for (const [bucket, tracks] of Object.entries(prev)) {
      updated[bucket] = tracks.map((t) =>
        t.id === id ? { ...t, ...props } : t
      );
    }
    return updated;
  });

  // 🔁 Sync Redux with local change
  if (props.volume !== undefined) {
    dispatch(setVolume({ trackId: id, volume: props.volume }));
  }
  if (props.sendLevel !== undefined) {
    dispatch(setSendLevel({ trackId: id, sendLevel: props.sendLevel }));
  }
}
  function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.meshes);
    setTrackList([]);
    // setAssignments({ null: [] })
    setMeshes([]);
    stopAll();
     clearAllBuffers();
  }


  // 2) When a Sound reports its current level (0→1), update it
  const handleLevelChange = useCallback((id, level) => {
    setSources((srcs) => srcs.map((s) => (s.id === id ? { ...s, level } : s)));
  }, []);

const handleVolumeChange = useCallback((trackId, newVol) => {
  dispatch(setVolume({ trackId, volume: newVol }))
}, [])

  const analyserMapRef = useRef({})

  // 4) When each Sound reports "here’s my analyser", stash it
  const handleAnalyserReady = useCallback((trackId, analyser) => {
    analyserMapRef.current[trackId] = analyser
  }, [])

const sourcesForFloor = useMemo(() => {
  return Object.entries(analyserMapRef.current)
    .filter(([id]) => settings[id]?.visible)
    .map(([id, analyser]) => ({
      analyser,
      volume: settings[id].volume ,        // whatever you store
      color: new THREE.Color(settings[id].color),
    }))
}, [settings])


function removeTrackById(trackId) {
if (activeNodesRef.current[trackId]) {
  try {
    activeNodesRef.current[trackId].stop();
  } catch (e) {
    console.warn('Failed to stop source node:', e);
  }
  delete activeNodesRef.current[trackId];
}
    const track = trackList.find((t) => t.id === trackId);
  if (track?.url) clearBuffer(track.url);
  // 1. Remove from trackList
  setTrackList((prev) => prev.filter((t) => t.id !== trackId));

  // 2. Remove from assignments (all buckets)
  setAssignments((prev) => {
    const next = {};
    for (const [bucket, arr] of Object.entries(prev)) {
      next[bucket] = arr.filter((t) => t.id !== trackId);
    }
    return next;
  });

  // 3. Remove from Redux store
  dispatch(removeTrack(trackId));
}
function removeMesh(partName) {
  setMeshes((m) => m.filter((mesh) => mesh !== partName));

  setAssignments((prev) => {
    const reassigned = [...(prev[partName] || [])];
    const next = { ...prev };
    delete next[partName];

    next.null = [...(next.null || []), ...reassigned];
    return next;
  });
}


  return (
    <div style={{ height: '100vh' }}>
      <div className='rev-params'>
        <div style={{ margin: '1em 0', zIndex: '20' }}>
          <button onClick={playAll} style={{ marginRight: '0.5em' }}>
            ▶️ Play All
          </button>
            <button onClick={pauseAll} style={{ marginRight: '0.5em' }}>
    ⏸ Pause
  </button>
          <button onClick={stopAll}>⏹ Stop All</button>

          <button onClick={clearSession}>Clear Session</button>
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
{/*         
        <div className='rev-sliders'>
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
        */}
      </div>
      {/* Left: Parts palette */}
      <div
        style={{ width: 200, borderRight: '1px solid #333' }}
        className='panel-left'
      >
        {/* <input
  type="range"
  min={0}
  max={Math.max(...trackList.map(t => t.buffer?.duration || 0))}
  step={0.01}
  value={scrubPos}
  onChange={(e) => {
  const seek = parseFloat(e.target.value);
  setPlayOffset(audioCtx.currentTime - seek);  // correct!
  setScrubPos(seek);
  if (playing) {
    setPlaying(false);
    setTimeout(() => setPlaying(true), 50);
  } else {
    setPauseTime(seek); // 🆕 add this!
  }
}}

/> */}
        {Object.keys(COMPONENTS).map((part) => (
          <button
            key={part}
            // disabled={meshes.includes(part)}
            onClick={() => addMesh(part)}
            style={{ display: 'block', margin: '4px 0' }}
          >
            {meshes.includes(part) ? 'Spawned' : 'Spawn'} {part}
          </button>
        ))}
      </div>

      {/* Center: 3D canvas */}
      <div style={{ flex: 1 }} className='canvas-main'>
        <Canvas camera={{ position: [0, 5, 20], fov: 35 }} dpr={[1, 2]} shadows gl={{ antialias : true,
        //  precision: 'highp'
        }}
         onCreated={({ gl }) => {
        gl.shadowMap.enabled    = true
        gl.shadowMap.type       = THREE.PCFSoftShadowMap
                // gl.shadowMap.type       = THREE.VSMShadowMap
        gl.physicallyCorrectLights = true
      }}
      >
         
          {/* <pointLight position={[5, 10, 5]} intensity={1000} /> */}
  {/* <fog attach="fog" args={['#050505', 65, 80]} /> */}
          {meshes.map((part, idx) => {
            const Part = COMPONENTS[part];
            const angle = (idx / meshes.length) * Math.PI * 2;
            const dist = 10 + idx * 5;
            const subs = assignments[part] || [];

            return (
              <ObjSound
          
                key={part}
                name={part}
                // defPos={defPos}
                dist={dist}
                subs={subs}
                on={playing}
                
                listener={listener}
                convolver={convolver}
                // analyser={analyser}
                onAnalyserReady={handleAnalyserReady}
                onVolumeChange={handleVolumeChange}
                onSubsChange={(newSubs) =>
                  setAssignments((a) => ({ ...a, [part]: newSubs }))
                }
                playStartTime={playOffset}
                pauseTime={pauseTime}
                masterTapGain={masterTapGain}
                visibleMap={settings}
                // mainDuration={longestDuration}
  onMainEnded={() => {
    setPauseTime(0);
    setPlayOffset(0);
    setPlaying(false);
  }}
  mainTrackId={mainTrackId}
   removeMesh={removeMesh}
   onNodeReady={(id, node) => {
  activeNodesRef.current[id]?.stop?.(); // Stop any old one
  activeNodesRef.current[id] = node;
}}
              >
                <Part />
              </ObjSound>
            );
          })}

          {/* Play unassigned tracks as well (just at listener position) */}
          {(assignments.null || []).map((sub) => {
            const isMain = sub.id === mainTrackId;
            return (
              <Sound
                key={sub.id}
                name={sub.name}
                subs={[sub]}
                on={playing}
                trackId={sub.id} 
                url={sub.url}
                paused={false}
                listener={listener}
                convolver={convolver}
                analyser={sources[0]?.analyser}
                onSubsChange={(newSubs) =>
                  setAssignments((a) => ({ ...a, null: newSubs }))
                }
                sendLevel={sub.sendLevel}
                volume={sub.volume}
                playStartTime={playOffset}
                pauseTime={pauseTime}
                // onAnalyserReady={(analyser) =>
                //   handleAnalyserReady(sub.id, analyser, sub.volume)
                // }
                 onAnalyserReady={handleAnalyserReady}

                // onVolumeChange={(vol) => handleVolumeChange(sub.id, vol)}
                onVolumeChange={handleVolumeChange}
                 masterTapGain={masterTapGain}
                visible={settings[sub.id]?.visible}
                buffer={sub.buffer}
 isMain={isMain}                      // ✅ NEW
      onMainEnded={() => {                 // ✅ NEW
        setPauseTime(0);
        setPlayOffset(0);
        setPlaying(false);
      }}
                // no meshRef or panner → dry playback
                onNodeReady={(id, node) => {
  activeNodesRef.current[id]?.stop?.(); // Stop any old one
  activeNodesRef.current[id] = node;
}}
              />
            );
          })}

          {mode === 'visualizerMode' && (
<FrequencySpectrum
    sources={sourcesForFloor}   // your AudioAnalyser
  playing={playing}           // your play flag
  // width={30}   
    // depth={10}               // spread across X
  maxHeight={15}              // Y scale
  // pointSize={6}               // size of each dot
/>)}
          <EnvComp  playing={playing}/>
          <Controls />
          <Perf deepAnalyze />
       <EffectComposer disableNormalPass>
          
    
     
            {/* <LensFlare occlusion={{ enabled: false }} enabled={false}/> */}
            {/* <DepthOfField focusDistance={0} focalLength={0.2} bokehScale={2} height={480} /> */}
            {/* <Bloom luminanceThreshold={.5} luminanceSmoothing={0.9} height={300} /> */}
            {/* <Noise opacity={0.02} /> */}
            {/* <Vignette eskil={false} offset={0.1} darkness={1.1} /> */}
          </EffectComposer>
        </Canvas>
        {/* <Tuner analyser={masterAnalyser} /> */}
      </div>

  <div className="console-container">
  <button className="toggle-button" onClick={() => setConsoleOpen(prev => !prev)}>
    {/* {consoleOpen ? '▼' : '▲'} */}
    <RxMixerVertical size={24}/>
  </button>
  <TrackConsole
    className={`track-console ${consoleOpen ? 'open' : ''}`}
    trackList={trackList}
    settings={settings}
    assignments={assignments}
    updateTrack={updateTrack}
    visibleMap={settings}
    toggleVisibility={(trackId) => dispatch(toggleVisibility(trackId))}
    setColor={(trackId, color) => dispatch(setColor({ trackId, color }))}
    onAdd={handleImport}
    onAutoAssign={handleAutoAssign}
    removeTrack={removeTrackById}
    meshes={meshes}
    toggleAssign={toggleAssign}
  />
</div>

     
    </div>
  );
}
