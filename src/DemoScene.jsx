// src/DemoScene.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { KeyboardControls } from '@react-three/drei'
import { useSelector, useDispatch } from 'react-redux'
import { addTrack, removeTrack, setVolume, setSendLevel } from './reducer/trackSettingsSlice'
import { useAudioListener, useAudioContext } from './AudioContextProvider'
import { useBufferCache } from './hooks/useBufferCache'
import { SceneContents } from './SceneContents'
import { Controls } from './ObjControls'
import EnvComp from './EnvComp'
import { CustomOrbitControls } from './CustomOrbitControls'

import { Kick } from './instruments/drumkit/Kick';
import { Snare } from './instruments/drumkit/SnareMin';
import { Hihat } from './instruments/drumkit/Hihat';
import { HihatMin } from './instruments/drumkit/HihatMin';
import { HiTom } from './instruments/drumkit/HiTom';
import { MidTom } from './instruments/drumkit/MidTom';
import { FloorTom } from './instruments/drumkit/FloorTom';
// import { Crash } from './instruments/drumkit/Crash';
import { CrashMin } from './instruments/drumkit/CrashMin';
import { Ride } from './instruments/drumkit/Ride';
import { RideMin } from './instruments/drumkit/RideMin';
import { Overheads } from './instruments/drumkit/Overheads';
import { BassSVTAmp } from './instruments/amps/BassSVTAmp';
import { GuitarAmp } from './instruments/amps/GuitarAmp';
import { Micro } from './instruments/mics/Micro';

const COMPONENTS = {
  Snare: Snare,
  Kick: Kick,
  Hihat: HihatMin,
  HiTom: HiTom,
  MidTom: MidTom,
  FloorTom: FloorTom,
  Crash: CrashMin,
  Ride: RideMin,
  Overheads: Overheads,
  Guitar: GuitarAmp,
  Bass: BassSVTAmp,
  Vocals: Micro,
};
// fixed mesh lineup
const DEMO_MESHES = [
  { id: 'bass1',   type: 'Bass',   name: 'Bass SVT Amp' },
  { id: 'guitar1', type: 'Guitar', name: 'Guitar Amp'   },
  { id: 'snare1',  type: 'Snare',  name: 'Snare Drum'   },
]

// fixed tracks to load
const DEMO_TRACKS = [
  { id: 't1', url: '/audio/bass_loop.mp3',   name: 'Bass Loop'   },
  { id: 't2', url: '/audio/guitar_loop.mp3', name: 'Guitar Loop' },
  { id: 't3', url: '/audio/snare_loop.mp3',  name: 'Snare Loop'  },
]

export default function DemoScene() {
  const listener = useAudioListener()
  const audioCtx = useAudioContext()
  const dispatch = useDispatch()
  const settings = useSelector((s) => s.trackSettings)
  const [playing, setPlaying] = useState(false)

  const { loadBuffer, clearBuffer } = useBufferCache(audioCtx)

  const [trackList, setTrackList] = useState([])
  const [assignments, setAssignments] = useState({
    bass1:   [],
    guitar1: [],
    snare1:  [],
    null:    [],
  })
  const [mainTrackId, setMainTrackId] = useState(null)

  // preload and assign the three demo tracks on mount
  useEffect(() => {
    let mounted = true

    Promise.all(
      DEMO_TRACKS.map((t) =>
        loadBuffer(t.url).then((buffer) => ({
          ...t,
          buffer,
          volume:    1,
          sendLevel: 0,
        }))
      )
    ).then((tracks) => {
      if (!mounted) return
      setTrackList(tracks)
      tracks.forEach((t) => dispatch(addTrack(t.id)))

      // simple 1:1 assignment
      setAssignments({
        bass1:   [tracks[0]],
        guitar1: [tracks[1]],
        snare1:  [tracks[2]],
        null:    [],
      })
      setMainTrackId(tracks[0].id)
    })

    return () => {
      mounted = false
      // cleanup Redux + buffers
      DEMO_TRACKS.forEach((t) => clearBuffer(t.url))
      trackList.forEach((t) => dispatch(removeTrack(t.id)))
    }
  }, [dispatch, loadBuffer, clearBuffer])

  // set up master gain/analyser
  const masterTapGain  = useMemo(() => audioCtx.createGain(), [])
  const masterAnalyser = useMemo(() => audioCtx.createAnalyser(), [])
  useMemo(() => {
    masterTapGain.gain.value = 1
    masterTapGain.connect(masterAnalyser)
  }, [masterTapGain, masterAnalyser])

  // build the single “props” object for SceneContents
  const canvasProps = useMemo(
    () => ({
      meshes: DEMO_MESHES,
      assignments,
      settings,
      listener,
      convolver: audioCtx.createConvolver(),
      masterTapGain,
      masterAnalyser,
      handleAnalyserReady: () => {},
      handleVolumeChange: (id, v) => dispatch(setVolume({ trackId: id, volume: v })),
      onSendLevelChange:  (id, s) => dispatch(setSendLevel({ trackId: id, sendLevel: s })),
      playing:    true,
      playOffset: 0,
      pauseTime:  0,
      setPlayOffset: () => {},
      setPauseTime:  () => {},
      setPlaying:    () => {},
      mainTrackId,
      removeMesh:    () => {},
      sceneState:    null,
      sourcesForFloor: [],
      updateTrack:   () => {},
      trackList,
      components:    COMPONENTS,    // import your COMPONENTS map
      onNodeReady:   () => {},
    }),
    [
      assignments,
      settings,
      listener,
      audioCtx,
      masterTapGain,
      masterAnalyser,
      mainTrackId,
      trackList,
      dispatch,
    ]
  )

  return (
    <KeyboardControls
      map={[
        { name: 'forward',  keys: ['w','W','ArrowUp']    },
        { name: 'backward', keys: ['s','S','ArrowDown']  },
        { name: 'left',     keys: ['a','A','ArrowLeft']  },
        { name: 'right',    keys: ['d','D','ArrowRight'] },
        { name: 'jump',     keys: ['Space']              },
      ]}
    >
      <Canvas
        camera={{ position: [10, 5, 20], fov: 35 }}
        shadows
        gl={{
          antialias: true,
          preserveDrawingBuffer: true,
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true
          gl.shadowMap.type = THREE.PCFSoftShadowMap
        }}
        onPointerMissed={() => {
          /* no selection logic in demo */
        }}
      >
        <EnvComp playing={playing} analyser={masterAnalyser} />
        <CustomOrbitControls />
        <Controls />
        <SceneContents {...canvasProps} />
      </Canvas>
    </KeyboardControls>
  )
}
