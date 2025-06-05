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
import { Snare } from './instruments/drumkit/SnareMin';
import { Hihat } from './instruments/drumkit/Hihat';
import { HiTom } from './instruments/drumkit/HiTom';
import { MidTom } from './instruments/drumkit/MidTom';
import { FloorTom } from './instruments/drumkit/FloorTom';
import { Crash } from './instruments/drumkit/Crash';
import { Ride } from './instruments/drumkit/Ride';
import { Overheads } from './instruments/drumkit/Overheads';
import { BassSVTAmp } from './instruments/amps/BassSVTAmp';
import { GuitarAmp } from './instruments/amps/GuitarAmp';
import { Micro } from './instruments/mics/Micro';
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  GodRays,
  Noise,
  Vignette,
} from '@react-three/postprocessing';

import { useSelector, useDispatch } from 'react-redux';
import { setMode, toggleMode } from './reducer/viewModeSlice';
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
import { useAudioContext, useAudioListener } from './AudioContextProvider';
import { useBufferCache } from './hooks/useBufferCache';
import TrackConsole from './TrackConsole';
import { RxMixerVertical } from 'react-icons/rx';
import { sceneState } from './utils/sceneState';
import { MeshSpawner } from './MeshSpawner';
import { SceneContents } from './SceneContents';
import PlayController from './PlayController';
const COMPONENTS = {
  Snare: Snare,
  Kick: Kick,
  Hihat: Hihat,
  HiTom: HiTom,
  MidTom: MidTom,
  FloorTom: FloorTom,
  Crash: Crash,
  Ride: Ride,
  Overheads: Overheads,
  Guitar: GuitarAmp,
  Bass: BassSVTAmp,
  Vocals : Micro
};

const STORAGE_KEYS = {
  trackList: 'myapp:trackList',
  assignments: 'myapp:assignments',
  meshes: 'myapp:meshes',
};

export default function App() {
  const listener = useAudioListener();
  const audioCtx = useAudioContext();

  const { loadBuffer, clearBuffer, clearAllBuffers, cache } =
    useBufferCache(audioCtx);

  const masterTapGain = useMemo(() => audioCtx.createGain(), [audioCtx]);
  const masterAnalyser = useMemo(() => audioCtx.createAnalyser(), [audioCtx]);
  // wire them once—no destination hookup!
  useMemo(() => {
    masterTapGain.gain.value = 1;
    masterTapGain.connect(masterAnalyser);
    // ──> (do *not* connect masterAnalyser to destination)
  }, [masterTapGain, masterAnalyser]);

  const dispatch = useDispatch();
  const settings = useSelector((state) => state.trackSettings);
  const mode = useSelector((state) => state.viewMode);

  const [consoleOpen, setConsoleOpen] = useState(false);
  const [spawnerOpen, setSpawnerOpen] = useState(false)

  const [playing, setPlaying] = useState(false);
  const [playOffset, setPlayOffset] = useState(0);
  const [pauseTime, setPauseTime] = useState(0);

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
    g.gain.value = 0.2; // default wet level
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

  function addMesh(type) {
    setMeshes((prev) => {
      const count = prev.filter((m) => m.type === type).length;
      const name = `${type} ${count + 1}`;
      return [...prev, { id: nanoid(), type, name }];
    });
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
          buffer, // ✅ store preloaded buffer
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
  function toggleAssign(trackObj, targetMeshId) {
    setAssignments((prev) => {
      const cleaned = Object.fromEntries(
        Object.entries(prev).map(([meshId, arr]) => [
          meshId,
          arr.filter((t) => t.id !== trackObj.id),
        ])
      );
      return {
        ...cleaned,
        [targetMeshId]: [...(cleaned[targetMeshId] || []), trackObj],
      };
    });
  }

  // assuming COMPONENTS is in scope, e.g.
  // const COMPONENTS = { Snare, Kick, … }

  async function handleAutoAssign(items) {
    const newTracks = await Promise.all(
      items.map(async (f) => {
        const buffer = await loadBuffer(f.url);
        return {
          id: nanoid(),
          file: f.file,
          url: f.url,
          name: f.name,
          buffer,
          volume: 1,
          sendLevel: 0,
        };
      })
    );

    setTrackList((prev) => [...prev, ...newTracks]);
    newTracks.forEach((t) => dispatch(addTrack(t.id)));

    // build map of available meshes (multiple per type)
    const meshBuckets = {}; // { Guitar: [meshId1, meshId2, ...] }
    meshes.forEach(({ id, type }) => {
      if (!meshBuckets[type]) meshBuckets[type] = [];
      meshBuckets[type].push(id);
    });

    // counters for round-robin assignment
    const assignedPerType = {};

    setAssignments((prev) => {
      const next = { ...prev };

      newTracks.forEach((t) => {
        const match = Object.keys(COMPONENTS).find((key) =>
          t.name.toLowerCase().includes(key.toLowerCase())
        );

       if (!match || !meshBuckets[match]?.length) {
    next['null'] = [...(next['null'] || []), t];
    return;
  }
        const candidates = meshBuckets[match];
        const idx = assignedPerType[match] || 0;
        const meshId = candidates[idx % candidates.length];
        assignedPerType[match] = idx + 1;

        next[meshId] = [...(next[meshId] || []), t];
      });

      return next;
    });
  }

  useEffect(() => {
    const longest = trackList.reduce((longest, track) => {
      return track.buffer?.duration > (longest?.buffer?.duration || 0)
        ? track
        : longest;
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
    console.log(audioCtx.currentTime, playOffset);
    setPauseTime(audioCtx.currentTime - playOffset);
    console.log(audioCtx.currentTime - playOffset);
    setPlaying(false);
  }
  function stopAll() {
    setPauseTime(0);
    setScrubPos(0); // ← record current play position
    setPlaying(false);
    setPlayOffset(0);
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
       trackList.forEach((track) => {
      dispatch(removeTrack(track.id));
    });
    localStorage.removeItem(STORAGE_KEYS.meshes);
    setTrackList([]);
    setAssignments({ null: [] })
    setMeshes([]);
    stopAll();
    clearAllBuffers();
  }
 const duration = useMemo(() => {
    const main = trackList.find((t) => t.id === mainTrackId);
    return main?.buffer?.duration || 0;
  }, [mainTrackId, trackList]);

const [currentTime, setCurrentTime] = useState(0);
useEffect(() => {
  let raf;
  function updateTime() {
    if (playing) {
      const elapsed = audioCtx.currentTime - playOffset;
      setCurrentTime(Math.min(elapsed, duration));
    }
    raf = requestAnimationFrame(updateTime);
  }
  raf = requestAnimationFrame(updateTime);
  return () => cancelAnimationFrame(raf);
}, [playing, playOffset, audioCtx, duration]);

  const handleVolumeChange = useCallback((trackId, newVol) => {
    dispatch(setVolume({ trackId, volume: newVol }));
  }, []);

  const analyserMapRef = useRef({});

  // 4) When each Sound reports "here’s my analyser", stash it
  const handleAnalyserReady = useCallback((trackId, analyser) => {
    analyserMapRef.current[trackId] = analyser;
  }, []);

  const sourcesForFloor = useMemo(() => {
    return Object.entries(analyserMapRef.current)
      .filter(([id]) => settings[id]?.visible)
      .map(([id, analyser]) => ({
        analyser,
        volume: settings[id].volume, // whatever you store
        color: new THREE.Color(settings[id].color),
      }));
  }, [settings]);

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
  function removeMesh(meshId) {
    const removed = meshes.find((m) => m.id === meshId);
    if (!removed) return;

    setMeshes((prev) => prev.filter((m) => m.id !== meshId));

    setAssignments((prev) => {
      const reassigned = [...(prev[meshId] || [])];
      const next = { ...prev };
      delete next[meshId];
      next.null = [...(next.null || []), ...reassigned];
      return next;
    });
  }

const onNodeReady = useCallback((trackId, node) => {
  // if there was an old node, stop it
  activeNodesRef.current[trackId]?.stop?.();
  activeNodesRef.current[trackId] = node;
}, []);


  const onReorderTracks = useCallback(({ active, over }) => {
    if (!over) return;
    setTrackList((prev) => {
      const oldIndex = prev.findIndex((t) => t.id === active.id);
      const newIndex = prev.findIndex((t) => t.id === over.id);
      const newList = Array.from(prev);
      newList.splice(oldIndex, 1);
      newList.splice(newIndex, 0, prev[oldIndex]);
      return newList;
    });
  }, []);


const canvasProps = useMemo(
  () => ({
    meshes,
    assignments,
    settings,
    listener,
    convolver,
    masterTapGain,
    masterAnalyser,
    handleAnalyserReady,
    handleVolumeChange,
    playing,
    playOffset,
    pauseTime,
    setPlayOffset,    
    setPauseTime,     
    setPlaying,       
    mainTrackId,
    removeMesh,
    sceneState,
    sourcesForFloor,
    updateTrack,
    trackList,
    components: COMPONENTS,
    onNodeReady,     
  }),
  [
    meshes,
    assignments,
    settings,
    listener,
    convolver,
    masterTapGain,
    masterAnalyser,
    handleAnalyserReady,
    handleVolumeChange,
    playing,
    playOffset,
    pauseTime,
    setPlayOffset,
    setPauseTime,
    setPlaying,
    mainTrackId,
    removeMesh,
    sceneState,
    sourcesForFloor,
    updateTrack,
    trackList,
    onNodeReady,
  ]
);


    const memoizedCanvas = useMemo(
    () => (
      <Canvas
        camera={{ position: [10, 5, 20], fov: 35 }}
        dpr={[1, 2]}
        shadows
        gl={{
          antialias: true,
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.physicallyCorrectLights = true;
        }}
        onPointerMissed={() => {
          sceneState.current = null;
        }}
      >
        {/*
          3) Pass in all scene props at once.
             SceneContents is wrapped in React.memo, but now _even_ the
             Canvas root won't re‐render unless canvasProps changes.
        */}
        <SceneContents {...canvasProps} />
        <Perf 
        // deepAnalyze={true}
        />
      </Canvas>
    ),
    // Only re‐memo when canvasProps changes
    [canvasProps]
  );

  return (
    <div style={{ height: '100vh' }}>
      <div className='rev-params'>
        {/* <div style={{ margin: '1em 0', zIndex: '20' }}>
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
        </div> */}
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
            <PlayController
      playAll={playAll}
      pauseAll={pauseAll}
      stopAll={stopAll}
      clearSession={clearSession}
      busLevel={busLevel}
      setBusLevel={setBusLevel}
      duration={duration}
      currentTime={currentTime}
      playing={playing}
    />
      </div>
      {/* Left: Parts palette */}
      {/* <div
        style={{ width: 200, borderRight: '1px solid #333' }}
        className='panel-left'
      > */}
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
        {/* {Object.keys(COMPONENTS).map((part) => (
          <button
            key={part}
            // disabled={meshes.includes(part)}
            onClick={() => addMesh(part)}
            style={{ display: 'block', margin: '4px 0' }}
          >
            {meshes.includes(part) ? 'Spawned' : 'Spawn'} {part}
          </button>
        ))}
      </div> */}
      <div    className={`spawner-container ${spawnerOpen ? 'open' : ''}`}>


        <button
          className="spawner-toggle"
          onClick={() => setSpawnerOpen((v) => !v)}
          >
          {spawnerOpen ? '×' : '☰'}
        </button>

        <MeshSpawner
        className={`mesh-spawner ${spawnerOpen ? 'open' : ''}`}
          components={COMPONENTS}
          meshes={meshes}
          addMesh={addMesh}
          />
        
      </div>

    

      {/* Center: 3D canvas */}
     <div className="canvas-main">
        {memoizedCanvas}
      </div>

      <div className='console-container'>
        <button
          className='toggle-button'
          onClick={() => setConsoleOpen((prev) => !prev)}
        >
          {/* {consoleOpen ? '▼' : '▲'} */}
          <RxMixerVertical size={24} />
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
            isReorderable={true}
          onReorder={onReorderTracks}
        />
      </div>
    </div>
  );
}
