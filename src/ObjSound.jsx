import { Suspense, useEffect, useMemo, useRef, useState } from 'react';

import { Html, Effects } from '@react-three/drei';
import { proxy, useSnapshot } from 'valtio';

import './App.css';
import { sceneState as state } from './utils/sceneState';
import Sound from './Sound';

// const state = proxy({ current: null, mode: 0 });
const modes = ['translate', 'rotate', 'scale'];

export default function ObjSound({  meshRef,
  file,
  dist,
  // paused,
  url,
  // volume,
  globalPlay,
  playTrigger,
  masterGain,
  reverbNode,
  reverbSend = 0,...props}) {
  const [paused, setPaused] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const snap = useSnapshot(state);
  // const meshRef = useRef();
  const [mainVol, setMainVol] = useState(0.5);
  // console.log(meshRef)
// console.log('WAAAAAAA',props)
  return (
    <mesh
      ref={meshRef}
      position={props.defPos}
      name={props.name}
      onDoubleClick={() => setPaused(!paused)}
      onClick={(e) => (e.stopPropagation(),
        (state.current = props.name))}
      onContextMenu={(e) => (
        e.stopPropagation(),
        snap.current === props.name &&
          (state.mode = (snap.mode + 1) % modes.length)
      )}
    >
      {/* <mesh> */}
      {/* {(props.name === "drums") ? (
  <group  >

  <Drums  />
  </group>
):

(props.name === "bass") ? ( <group  >

  <Bass />
  </group>)
  :
( */}
      <mesh
        ref={meshRef}
        position={[0, volume * 5, 0]}
        visible={true}
        castShadow
        receiveShadow
        scale={volume * 10}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={'#ff00ff'}
          emissive={'#000000'}
          roughness={0.5}
          metalness={0.51}
        />
      </mesh>
      <Html center position={[0, 1, 0]}>
        <div
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            background: 'rgba(0,0,0,0.6)',
            padding: '4px',
            borderRadius: '4px',
          }}
        >
          <label style={{ color: 'white', fontSize: '0.7em' }}>
            {props.name}
          </label>
          <input
            type='range'
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
          />
        </div>
      </Html>

    {props.masterGain != null && (
      
      <Sound
      meshRef={meshRef}
      name={props.name}
      on={props.on}
      paused={paused}
      volume={volume}
      file={file}
      dist={dist}
      delayTime={props.delay}
      url={url}
      mainVol={mainVol}
      playTrigger={playTrigger}
      globalPlay={globalPlay}
      masterGain={masterGain}
      reverbNode={reverbNode}
      />
    )}
    </mesh>
  );
}
