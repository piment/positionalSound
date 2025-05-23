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

export function ObjSound({ name,  group, defPos, dist,  subs = [],
  on, listener, convolver, onSubsChange }) {
  const meshRef = useRef();
  const [paused, setPaused] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [width, setWidth] = useState(1);
  const [sendLevel, setSendLevel] = useState(0);
  const snap = useSnapshot(sceneState);
  const clonedGroup = useMemo(() => {
    if (!group) return null;
    const c = group.clone(true);
    c.updateMatrixWorld();
    c.traverse((n) => {
      if (n.isMesh && n.material) {
        n.material = Array.isArray(n.material)
          ? n.material.map((m) => m.clone())
          : n.material.clone();
      }
    });
    return c;
  }, [group]);;
// console.log(subs)
  return (
   <group
      ref={meshRef}
      // position={defPos}          // <<–– actually place it in the world
      name={name}
      // onDoubleClick={() => setPaused((p) => !p)}
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
      {/** Render your drum-kit sub-group **/}
      {clonedGroup && <primitive object={clonedGroup} />}

      {/** Then hook up all your subs’ Sound nodes **/}
      {subs.map((sub, idx) => (
        <>
       
        <Sound
          key={sub.name}
          meshRef={meshRef}
          url={sub.url}
          dist={dist}
          volume={sub.volume * volume}
          on={on}
          paused={paused}
          listener={listener}
          convolver={convolver}
          sendLevel={sub.sendLevel}
          onSendLevelChange={(val) => {
            const next = subs.map((s, j) =>
              j === idx ? { ...s, sendLevel: val } : s
            );
            onSubsChange(next);
          }}
        />
     


   {snap.current === name && (
            <Html center position={[0+idx * 0.6, 1  , 0]}>
              <div onPointerDown={(e) => e.stopPropagation()} style={{ background: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 4, marginBottom: 4 }}>
                <label style={{ color: 'white', fontSize: '0.7em' }}>{sub.name} Volume</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={sub.volume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    const next = subs.map((s, j) => (j === idx ? { ...s, volume: val } : s));
                    onSubsChange(next);
                  }}
                />
              </div>
              <div onPointerDown={(e) => e.stopPropagation()} style={{ background: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 4 }}>
                <label style={{ color: 'white', fontSize: '0.7em' }}>{sub.name} Send</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={sub.sendLevel}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    const next = subs.map((s, j) => (j === idx ? { ...s, sendLevel: val } : s));
                    onSubsChange(next);
                  }}
                />
              </div>
            </Html>
          )}
           </>
 ))}
    
    </group>
  );
}
