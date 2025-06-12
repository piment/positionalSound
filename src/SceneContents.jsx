// SceneContents.jsx
import React, { memo, Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { ObjSound } from './ObjControls';
import EnvComp from './EnvComp';
import { Controls } from './ObjControls';
import Sound from './Sound';
import FrequencySpectrum from './FrequencySpectrum';


export const SceneContents = memo(function SceneContents({
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
  setPlaying,
  playOffset,
  setPlayOffset,
  pauseTime,
  setPauseTime,
   setUiVisible,
  mainTrackId,
  removeMesh,
  sceneState,
  sourcesForFloor,
  updateTrack,
  trackList,
  components,
    onNodeReady,
}) {
  return (
    <>
      {meshes.map((meshObj, idx) => {
        const { id, type, name } = meshObj;
        const Part = components[type]; // assume COMPONENTS is imported or in scope
        const angle = (idx / meshes.length) * Math.PI * 2;
        const dist = 10 + idx * 5;
        const subs = assignments[id] || [];
        const syncedSubs = subs.map((t) => ({
          ...t,
          volume: settings[t.id]?.volume ?? t.volume,
          sendLevel: settings[t.id]?.sendLevel ?? t.sendLevel,
        }));
        return (
          <ObjSound
            key={id}
            name={name}
            dist={dist}
            subs={syncedSubs}
            on={playing}
         
            listener={listener}
            convolver={convolver}
            onAnalyserReady={handleAnalyserReady}
            onVolumeChange={handleVolumeChange}
            playStartTime={playOffset}
            pauseTime={pauseTime}
            masterTapGain={masterTapGain}
            visibleMap={settings}
            onMainEnded={() => {
              setPauseTime(0);
              setPlayOffset(0);
              setPlaying(false);
               setUiVisible(true)
            }}
            mainTrackId={mainTrackId}
            removeMesh={() => removeMesh(id)}
            onNodeReady={(trackId, node) => {
          onNodeReady(trackId, node);
            }}
          >
            <Part  position={meshObj.position} rotation={meshObj.rotation}/>
          </ObjSound>
        );
      })}

      {(assignments.null || []).map((sub) => {
        const isMain = sub.id === mainTrackId;
         const reduxVolume = settings[sub.id]?.volume ?? sub.volume ?? 0;
        const reduxSend = settings[sub.id]?.sendLevel ?? sub.sendLevel ?? 0;
          const reduxPan = settings[sub.id]?.pan ?? 0;
        return (
          <Sound
            key={sub.id}
            name={sub.name}
            subs={[sub]}
            on={playing}
            trackId={sub.id}
            url={sub.url}
            paused={false}
              volume={reduxVolume}
            sendLevel={reduxSend}
             pan={reduxPan} 
            listener={listener}
            convolver={convolver}
            onAnalyserReady={handleAnalyserReady}
            // onVolumeChange={handleVolumeChange}
               onVolumeChange={(trackId, newVol) =>
        updateTrack(trackId, { volume: newVol })
      }
            masterTapGain={masterTapGain}
                   playStartTime={playOffset}    
            pauseTime={pauseTime}
            visible={settings[sub.id]?.visible}
            buffer={sub.buffer}
            isMain={isMain}
            onMainEnded={() => {
              // ✅ NEW
              setPauseTime(0);
              setPlayOffset(0);
              setPlaying(false);
              setUiVisible(true)
            }}
            // no meshRef or panner → dry playback
            onNodeReady={(id, node) => {
                onNodeReady(id, node);
            }}
            meshRef={null}
          />
        );
      })}
      <Suspense fallback={null}>
      <EnvComp
        playing={playing}
        analyser={masterAnalyser}
      /></Suspense>
      <Controls />
      {/* {settings.  && (
        <FrequencySpectrum
          sources={sourcesForFloor}
          playing={playing}
          maxHeight={15}
        />
      )} */}
    </>
  );
});
