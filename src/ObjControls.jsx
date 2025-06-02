import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSnapshot, proxy } from 'valtio';
import { Html, OrbitControls, TransformControls } from '@react-three/drei';
import Sound from './Sound';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const modes = ['translate', 'rotate'];
const sceneState = proxy({ current: null, mode: 0 });

export function Controls() {
  const snap = useSnapshot(sceneState);
  const scene = useThree((state) => state.scene);

  return (
    <>
      {snap.current && (
        <TransformControls
          object={scene.getObjectByName(snap.current).children[0]}
          mode={modes[snap.mode]}
          // mode='translate'
          // showY={false}
          showY={modes[snap.mode] === 'translate' ? false : true}
            showX={modes[snap.mode] === 'rotate' ? false : true}
              showZ={modes[snap.mode] === 'rotate' ? false : true}
          rotateX={false}
          rotateZ={false}
          translateY={0}
          // position={scene.getObjectByName(snap.current)?.userData?.center}
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
  playStartTime,
  pauseTime,
  onAnalyserReady,
  onLevelChange,
  onVolumeChange,
  masterTapGain,
 visibleMap,
 mainDuration, onMainEnded,
 mainTrackId,
}) {
  const [paused, setPaused] = useState(false);
  const snap = useSnapshot(sceneState);
  const smoothRef = useRef(0);
  const outerRef = useRef(); // the <group> you already had
  const innerRef = useRef(); // we’ll point this at the positioned child
    const positionRef = useRef(new THREE.Vector3());
  const [lights, setLights] = useState([])
  const [levels, setLevels] = useState({})
const meshTrackId = subs.length > 0 ? subs[0].id : null;

  // 2) **Narrow‐cast** to only the fields we need from visibleMap:
  const visible = visibleMap[meshTrackId]?.visible ?? false;

  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    if (outer && outer.children[0].children.length) {
      // assume the *first* child is the <group position=[…]> from your Part
      innerRef.current = outer.children[0].children[0];
      setReady(true);
    }
  }, []);

  function handleAnalysedLevel(subId, level) {
    setLevels(prev => {
      // bail out if unchanged to avoid extra rerenders
      if (prev[subId] === level) return prev
      return { ...prev, [subId]: level }
    })
  }
  const trackLevel = useMemo(() => {
    const vals = Object.values(levels)
    if (!vals.length) return 0
    // e.g. use average
    return vals.reduce((sum, v) => sum + v, 0) / vals.length
  }, [levels])


    useEffect(() => {
    if (!outerRef.current) return
    const arr = []
    outerRef.current.traverse(obj => {
      if (obj.isPointLight) arr.push(obj)
    })
    setLights(arr)
  }, [])

  // cache pad-material meshes once after mount
  const [padMeshes, setPadMeshes] = useState([]);
  useEffect(() => {
    if (!outerRef.current) return;
    const arr = [];
    outerRef.current.traverse((obj) => {
      if (obj.isMesh && obj.material.name === 'padMat') {
        arr.push(obj);
      }
    });
    setPadMeshes(arr);
  }, []);

  // every frame, use playLevel (a number!) to drive emissive
  useFrame((_, delta) => {
   if (!padMeshes.length && lights.length === 0) return;

    // Optionally boost low/mid levels
    const boosted = Math.sqrt(smoothRef.current); // sqrt gives more punch on quieter sounds

    // Use different lambdas for attack vs release:
    const lambda =
      boosted > smoothRef.current
        ? 0 // fast attack
        : 30; // even faster release

    // Smoothed value → smoothRef.current
   smoothRef.current = THREE.MathUtils.damp(
      smoothRef.current,
      trackLevel,
      30,   // attack/release speed
      delta
    )


    // Map 0→1 into 0→maxIntensity
    const intensity = THREE.MathUtils.lerp(2.52, 5, smoothRef.current);

    padMeshes.forEach((m) => {
      // set to zero when smoothRef is zero → totally dark
      const hex = visibleMap[meshTrackId]?.color
if (hex) {m.material.emissive.set(hex)
  m.material.color.set(hex)
m.material.blendEquation = THREE.SubtractiveBlending ;
}
      m.material.emissiveIntensity = intensity;
      // keep color proportional to level (or leave it white)
      m.material.emissive.setScalar(smoothRef.current*2);
    });
// console.log(playLevel)
   lights.forEach((light) => {
  const multiplier = light.userData?.intensityMultiplier ?? 1;
  const lightInt = THREE.MathUtils.lerp(0, 154, smoothRef.current) * multiplier;
  light.intensity = lightInt;

  if (!visibleMap) return;
  const hex = visibleMap[meshTrackId]?.color || '#ffffff';
  light.color.set(hex);
});
  });

  // console.log('ORRRRR', outerRef.current)
  return (
    <group
      ref={outerRef}
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
      {children}

      {subs.map((sub, idx) => (
        
        <Sound
          key={`dry:${sub.id}:${name}`}
          meshRef={outerRef}
          url={sub.url}
          dist={dist}
          volume={sub.volume}
          on={on}
          trackId={sub.id} 
          paused={paused}
          listener={listener}
          convolver={convolver}
          // sendLevel={sub.sendLevel}
              sendLevel={sub.sendLevel}
          // onSendLevelChange={(val) => {
          //   const next = subs.map((s, j) =>
          //     j === idx ? { ...s, sendLevel: val } : s
          //   );
          //   onSubsChange(next);
          // }}
          playStartTime={playStartTime}
//  onVolumeChange={onVolumeChange}
          masterTapGain={masterTapGain}
    visible={visible} 
    //  onAnalysedLevel={(lvl) => handleLevel(sub.id, lvl)}
          onAnalysedLevel={(lvl) => handleAnalysedLevel(sub.id, lvl)}
    //  onAnalyserReady={(id, a, vol) => onAnalyserReady(id, a, vol)}
    onAnalyserReady={onAnalyserReady}
    //  onVolumeChange={(id, v) => onVolumeChange(id, v)}
      // position={positionRef.current.clone()}
        buffer={sub.buffer}
        pauseTime={pauseTime}
        mainDuration={mainDuration}
      onMainEnded={onMainEnded}
       isMain={sub.id === mainTrackId ? true : false}               

        />
      ))}

      {/* only show sliders when selected */}
      {/* {snap.current === name && (
        <Html center position={[0, 1.5, 0]}>
          {subs.map((sub, idx) => (
            <div key={sub.id} style={{ marginBottom: 8 }}>
              <div
                style={{
                  background: 'rgba(0,0,0,0.6)',
                  padding: 4,
                  borderRadius: 4,
                }}
              >
                <label style={{ color: '#fff', fontSize: '0.7em' }}>
                  {sub.name} Vol
                </label>
                <input
                  type='range'
                  min={0}
                  max={1}
                  step={0.01}
                  value={sub.volume}
              onChange={e => {
                e.stopPropagation()
          const newVol = parseFloat(e.target.value)
          // 1) update local subs[] state
          onSubsChange(
            subs.map(s =>
              s.id === sub.id ? { ...s, volume: newVol } : s
            )
          )
          // 2) notify App of *volume* change
          onVolumeChange(sub.id, newVol)
        }}
                />
              </div>
              <div
                style={{
                  background: 'rgba(0,0,0,0.6)',
                  padding: 4,
                  borderRadius: 4,
                  marginTop: 4,
                }}
              >
                <label style={{ color: '#fff', fontSize: '0.7em' }}>
                  {sub.name} Send
                </label>
                <input
                  type='range'
                  min={0}
                  max={1}
                  step={0.01}
                  value={sub.sendLevel}
                   onChange={e => {
          const newSend = parseFloat(e.target.value)
          // 1) update *sendLevel* in your subs[]
          onSubsChange(
            subs.map(s =>
              s.id === sub.id ? { ...s, sendLevel: newSend } : s
            )
          )
          // 2) **do not** call onVolumeChange here!
          //    If you want to expose sendLevel to App you’d call:
          // onSendLevelChange(sub.id, newSend)
        }}
                />
              </div>
            </div>
          ))}
        </Html>
      )} */}
    </group>
  );
}
