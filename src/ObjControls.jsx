import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSnapshot, proxy } from 'valtio';
import { Html, OrbitControls, TransformControls } from '@react-three/drei';
import Sound from './Sound';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three'
import SoundParticles from './SoundParticles';
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
      <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.75} />
    </>
  );
}

export function ObjSound({
  name,
  defPos = [0, 0, 0],
  dist = 1,
  subs = [],
  on,
  listener,
  convolver,
  onSubsChange,
  children,
  playStartTime
}) {
  const groupRef = useRef();
  const [paused, setPaused] = useState(false);
  const snap = useSnapshot(sceneState);
 const [levels, setLevels] = useState({}); 
  const smoothRef = useRef(0);
  const outerRef   = useRef()   // the <group> you already had
  const innerRef   = useRef()   // we’ll point this at the positioned child
  const [ready, setReady] = useState(false)

    useLayoutEffect(() => {
    const outer = outerRef.current
    if (outer && outer.children[0].children.length) {
      // assume the *first* child is the <group position=[…]> from your Part
      innerRef.current = outer.children[0].children[0]
      setReady(true)
    }
  }, [])
  // callback we pass down to each Sound
  function handleLevel(subId, level) {
    setLevels((prev) => {
      if (prev[subId] === level) return prev;
      return { ...prev, [subId]: level };
    });
  }
 const playLevel = useMemo(() => {
    const vals = Object.values(levels);
    if (vals.length === 0) return 0;
    const sum = vals.reduce((a, v) => a + v, 0);
    return sum / vals.length;   // average, still 0→1
  }, [levels]);

  // cache pad-material meshes once after mount
  const [padMeshes, setPadMeshes] = useState([]);
  useEffect(() => {
    if (!outerRef.current) return;
    const arr = [];
    outerRef.current.traverse(obj => {
      if (obj.isMesh && obj.material.name === 'padMat') {
        arr.push(obj);
      }
    });
    setPadMeshes(arr);
  }, []);

  // every frame, use playLevel (a number!) to drive emissive
  useFrame((_, delta) => {
    if (!padMeshes.length) return;

    // Optionally boost low/mid levels
    const boosted = Math.sqrt(playLevel);  // sqrt gives more punch on quieter sounds

    // Use different lambdas for attack vs release:
    const lambda = boosted > smoothRef.current
      ? 20  // fast attack
      : 30; // even faster release

    // Smoothed value → smoothRef.current
    smoothRef.current = THREE.MathUtils.damp(
      smoothRef.current,
      boosted,
      lambda,
      delta
    );

    // Map 0→1 into 0→maxIntensity
    const intensity = THREE.MathUtils.lerp(0.2, 5, smoothRef.current);

    padMeshes.forEach((m) => {
      // set to zero when smoothRef is zero → totally dark
      m.material.emissiveIntensity = intensity;
      // keep color proportional to level (or leave it white)
      m.material.emissive.setScalar(smoothRef.current);
    });
  });

  // useLayoutEffect(() => {
  //   if (!groupRef.current) return;
  //   const worldPos = new THREE.Vector3();
  //   groupRef.current.getWorldPosition(worldPos);
  //   setOffset(worldPos.toArray());
  // }, []);
console.log('OUTER', outerRef)
  return (
    <group
    ref={outerRef}
      // position={defPos}
      
      scale={5}
      name={name}
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
   
      {children }
      

  <SoundParticles               
       emitterRef={innerRef}
        playLevel={playLevel}
        maxParticles={300}
        minLife={0.3}
        maxLife={1}
        baseSpeed={3} />
        {/* </group> */}
      {/* audio nodes */}
      {subs.map((sub, idx) => (
        <Sound
           key={`dry:${sub.id}:${name}`}
          meshRef={outerRef}
          url={sub.url}
          dist={dist}
          volume={sub.volume}
          on={on}
          paused={paused}
          listener={listener}
          convolver={convolver}
          sendLevel={sub.sendLevel}
          onSendLevelChange={(val) => {
            const next = subs.map((s, j) => (j === idx ? { ...s, sendLevel: val } : s));
            onSubsChange(next);
          }}
            playStartTime={playStartTime}
             onAnalysedLevel={(level) => handleLevel(sub.id, level)}
        />
      ))}

      {/* only show sliders when selected */}
      {snap.current === name && (
        <Html center position={[0, 1.5, 0]}>
          {subs.map((sub, idx) => (
            <div key={sub.id} style={{ marginBottom: 8 }}>
              <div style={{ background: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 4 }}>
                <label style={{ color: '#fff', fontSize: '0.7em' }}>{sub.name} Vol</label>
                <input
                  type="range"
                  min={0} max={1} step={0.01}
                  value={sub.volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    const next = subs.map((s, j) => (j === idx ? { ...s, volume: v } : s));
                    onSubsChange(next);
                  }}
                />
              </div>
              <div style={{ background: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 4, marginTop: 4 }}>
                <label style={{ color: '#fff', fontSize: '0.7em' }}>{sub.name} Send</label>
                <input
                  type="range"
                  min={0} max={1} step={0.01}
                  value={sub.sendLevel}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    const next = subs.map((s, j) => (j === idx ? { ...s, sendLevel: v } : s));
                    onSubsChange(next);
                  }}
                />
              </div>
            </div>
          ))}
        </Html>
      )}
    </group>
  );
}
