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
} from '@react-three/postprocessing';

import { useSelector, useDispatch } from 'react-redux';
import { setMode, toggleMode }      from './reducer/viewModeSlice'
import {
  addTrack,
  removeTrack,
  toggleVisibility,
  setColor,
  setVolume
} from './reducer/trackSettingsSlice';
import FrequencySpectrum from './FrequencySpectrum';

const COMPONENTS = {
  Snare: Snare,
  Kick: Kick,
  Hihat: Hihat,
  HiTom: HiTom,
  MidTom: MidTom,
  FloorTom: FloorTom,
  Crash: Crash,
  Ride: Ride,
};

const STORAGE_KEYS = {
  trackList: 'myapp:trackList',
  assignments: 'myapp:assignments',
  meshes: 'myapp:meshes',
};

export default function App() {
  const listener = useMemo(() => new THREE.AudioListener(), []);
  const audioCtx = listener.context;


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

  const [tracks, setTracks] = useState([]);
  const [playing, setPlaying] = useState(false);
  const [sources, setSources] = useState([]);

  const [playOffset, setPlayOffset] = useState(0);
  const sourcesRef = useRef([]);
  const [trackList, setTrackList] = useState([]);
  const [assignments, setAssignments] = useState({ null: [] });

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

  function handleImport(items) {
    // build full track objects
    const newTracks = items.map((f) => ({
      id: nanoid(),
      file: f.file,
      url: f.url,
      name: f.name,
      volume: 1,
      sendLevel: 0,
    }));

    // optionally keep a flat list too
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

function handleAutoAssign(items) {
  // 1) build the same track objects
  const newTracks = items.map(f => ({
    id:   nanoid(),
    file: f.file,
    url:  f.url,
    name: f.name,
    volume: 1,
    sendLevel: 0,
  }))

  // 2) add to your flat list
  setTrackList(prev => [...prev, ...newTracks])

  // 3) dispatch Redux addTrack for each
  newTracks.forEach(t => dispatch(addTrack(t.id)))

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



  async function playAll() {
    setPlayOffset(audioCtx.currentTime);
    setPlaying(true);
  }
  function stopAll() {

    // setSources([])
    setPlaying(false);
    // setPlayStartTime(null);
  }

  function updateUnassignedTrack(id, props) {
    setAssignments((a) => ({
      ...a,
      null: a.null.map((t) => (t.id === id ? { ...t, ...props } : t)),
    }));
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.meshes);
    setTrackList([]);
    // setAssignments({ null: [] })
    setMeshes([]);
    stopAll();
  }


  // 2) When a Sound reports its current level (0→1), update it
  const handleLevelChange = useCallback((id, level) => {
    setSources((srcs) => srcs.map((s) => (s.id === id ? { ...s, level } : s)));
  }, []);

  // // 3) When the user moves a volume slider, update that entry
  // const handleVolumeChange = useCallback((id, volume) => {
  //   setSources((srcs) => srcs.map((s) => (s.id === id ? { ...s, volume } : s)));
  // }, []);
const handleVolumeChange = useCallback((trackId, newVol) => {
  dispatch(setVolume({ trackId, volume: newVol }))
}, [dispatch])

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
  // console.log(sources)
  return (
    <div style={{ height: '100vh' }}>
      <div className='rev-params'>
        <div style={{ margin: '1em 0', zIndex: '20' }}>
          <button onClick={playAll} style={{ marginRight: '0.5em' }}>
            ▶️ Play All
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
        {/* <div className='rev-sliders'>
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
        </div> */}
      </div>
      {/* Left: Parts palette */}
      <div
        style={{ width: 200, borderRight: '1px solid #333' }}
        className='panel-left'
      >
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
        <Canvas camera={{ position: [0, 5, 20], fov: 35 }} dpr={[1, 2]} shadows>
          <ambientLight intensity={0.3} />
          <pointLight position={[5, 10, 5]} intensity={1} />

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
                masterTapGain={masterTapGain}
                visibleMap={settings}
              >
                <Part />
              </ObjSound>
            );
          })}

          {/* Play unassigned tracks as well (just at listener position) */}
          {(assignments.null || []).map((sub) => {
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
                // onAnalyserReady={(analyser) =>
                //   handleAnalyserReady(sub.id, analyser, sub.volume)
                // }
                 onAnalyserReady={handleAnalyserReady}

                // onVolumeChange={(vol) => handleVolumeChange(sub.id, vol)}
                onVolumeChange={handleVolumeChange}
                 masterTapGain={masterTapGain}
                visible={settings[sub.id]?.visible}
                // no meshRef or panner → dry playback
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
          <EnvComp />
          <Controls />
          <Perf deepAnalyze />
 
        </Canvas>
        {/* <Tuner analyser={masterAnalyser} /> */}
      </div>

      {/* Right: Track list & assignment UI */}
      <div
        style={{ width: 300, borderLeft: '1px solid #333' }}
        className='panel-right'
      >
        <ImportMenu onAdd={handleImport} onAutoAssign={handleAutoAssign}/>

        <h4>Tracks</h4>
        {/* {trackList.map((t) => (
          <div key={t.id}>
            {t.name}
            <select
              value={
                // find which bucket it lives in, or 'null'
                Object.entries(assignments).find(([, arr]) =>
                  arr.some((x) => x.id === t.id)
                )?.[0] || 'null'
              }
              onChange={(e) => toggleAssign(t, e.target.value)}
            >
              <option value='null'>Unassigned</option>
              {meshes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        ))} */}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {trackList.map((t) => {
            const isOpen = selectedTrackId === t.id;
            const bucket =
              Object.entries(assignments).find(([, arr]) =>
                arr.some((x) => x.id === t.id)
              )?.[0] || 'null';
            const cfg = settings[t.id] || { visible: false, color: '#88ccff' };
            return (
              <li key={t.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button
                    onClick={() => setSelectedTrackId(isOpen ? null : t.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#00f',
                      cursor: 'pointer',
                      padding: 0,
                      marginRight: 8,
                    }}
                  >
                    {t.name}
                  </button>
                  <select
                    disabled={!meshes.length}
                    value={bucket}
                    onChange={(e) => toggleAssign(t, e.target.value)}
                  >
                    <option value='null'>Unassigned</option>
                    {meshes.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                {isOpen && (
                  <div style={{ marginTop: 8, paddingLeft: 16 }}>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: '0.8em' }}>{t.name} Vol</label>
                      <input
                        type='range'
                        min={0}
                        max={1}
                        step={0.01}
                        value={
                          assignments.null.find((x) => x.id === t.id)?.volume ||
                          0
                        }
                        onChange={(e) =>
                          updateUnassignedTrack(t.id, {
                            volume: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8em' }}>{t.name} Send</label>
                      <input
                        type='range'
                        min={0}
                        max={1}
                        step={0.01}
                        value={
                          assignments.null.find((x) => x.id === t.id)
                            ?.sendLevel || 0
                        }
                        onChange={(e) =>
                          updateUnassignedTrack(t.id, {
                            sendLevel: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div
                      key={t.id}
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      <input
                        type='checkbox'
                        checked={cfg.visible}
                        onChange={() => dispatch(toggleVisibility(t.id))}
                      />
                      {/* <label style={{ marginRight: 8 }}>{t.name}</label> */}
                      <input
                        type='color'
                        value={cfg.color}
                        onChange={(e) =>
                          dispatch(
                            setColor({ trackId: t.id, color: e.target.value })
                          )
                        }
                      />
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
