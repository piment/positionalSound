import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls } from '@react-three/drei';

import { Html } from '@react-three/drei';
import { proxy, useSnapshot } from 'valtio';
import Sound from './Sound';

// global scene state for transform controls
const modes = ['translate', 'rotate', 'scale'];
const sceneState = proxy({ current: null, mode: 0 });

export function Controls() {
  const snap = useSnapshot(sceneState);
  const scene = useThree((state) => state.scene);

  return (
    <>
      {snap.current && (
        <TransformControls
          object={scene.getObjectByName(snap.current)}
          mode={modes[snap.mode]}
        />
      )}
      <OrbitControls
        makeDefault
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 1.75}
      />
    </>
  );
}

export function ObjSound({ name, defPos,   group,
  url, dist, audioCtx, on, listener, convolver }) {
  const meshRef = useRef();
  const [paused, setPaused] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [width, setWidth] = useState(1);
  const [sendLevel, setSendLevel] = useState(0);
  const snap = useSnapshot(sceneState);

  return (
    <mesh
      ref={meshRef}
      position={defPos}
      name={name}
      onDoubleClick={() => setPaused((p) => !p)}
      onClick={(e) => {
        e.stopPropagation();
        sceneState.current = name;
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        if (snap.current === name) {
          sceneState.mode = (snap.mode + 1) % modes.length;
        }
      }}
    >
         
      {/* Visual indicator: cube scaled by volume */}
      <mesh
        position={[0, volume * 5, 0]}
        scale={volume * 10}
        castShadow
        receiveShadow
      >   {group && <primitive object={group.clone()} />}
        {/* <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color='#ff00ff' /> */}
      </mesh>

      {/* HTML slider for volume control */}
      <Html center position={[0, 1, 0]}>
        <div
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            background: 'rgba(0,0,0,0.6)',
            padding: '4px',
            borderRadius: '4px',
          }}
        >
          <label style={{ color: 'white', fontSize: '0.7em' }}>Send</label>
          <input
            type='range'
            min={0}
            max={1}
            step={0.01}
            value={sendLevel}
            onChange={(e) => setSendLevel(parseFloat(e.target.value))}
          />
        </div>
        <div
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            background: 'rgba(0,0,0,0.6)',
            padding: '4px',
            borderRadius: '4px',
          }}
        >
          <label style={{ color: 'white', fontSize: '0.7em' }}>{name}</label>
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

      {/* Positional audio component */}
      <Sound
        meshRef={meshRef}
        url={url}
        dist={dist}
        volume={volume}
        on={on}
        width={width}
        paused={paused}
        audioCtx={audioCtx}
        listener={listener}
        convolver={convolver}
        sendLevel={sendLevel}
      />
    </mesh>
  );
}
