import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSnapshot } from 'valtio';
import { sceneState } from './utils/sceneState';
import { Html, KeyboardControls, OrbitControls, TransformControls, useKeyboardControls } from '@react-three/drei';
import Sound from './Sound';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import './css/ObjControls.css';

const modes = ['translate', 'rotate'];
// const sceneState = proxy({ current: null, mode: 0 });

export function Controls() {
  const snap = useSnapshot(sceneState);
  const { camera, scene } = useThree();
  const selectedObject = scene.getObjectByName(snap.current);
  const hasChild = selectedObject?.children?.[0];

  const controlsRef = useRef();


//  useEffect(() => {
//     const handler = (e) => {
//       console.log(e.code, e.keyCode);
//       if (e.code === 'Numpad1') {
//         console.log('👌 Numpad1 pressed');
//       }
//     };
//     window.addEventListener('keydown', handler);
//     return () => window.removeEventListener('keydown', handler);
//   }, []);
  useEffect(() => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;

    // allow pan, but we'll clamp vertical movement ourselves:
    ctrl.enablePan = true;

    // You can also tune this:
    ctrl.screenSpacePanning = true; // pan in screen-space

    // zoom limits:
    ctrl.minDistance = 5;
    ctrl.maxDistance = 100;

    // look-angle limits:
    ctrl.minPolarAngle = 0.001;
    ctrl.maxPolarAngle = Math.PI / 2;


    // floor height clamp:
    const floorY = 0.1;

    const onChange = () => {
      // clamp camera height
      if (camera.position.y < floorY) {
        camera.position.y = floorY;
      }
      // clamp where we're looking (so up/down pan is canceled)
      if (ctrl.target.y < floorY) {
        ctrl.target.y = floorY;
      }
    };

    // hook into Drei's internal OrbitControls
    ctrl.addEventListener('change', onChange);
    return () => void ctrl.removeEventListener('change', onChange);
  }, [camera]);
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
        ref={controlsRef}
        makeDefault
        minPolarAngle={0}
        enableDamping
        dampingFactor={0.1}
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
  mainDuration,
  onMainEnded,
  mainTrackId,
  removeMesh,
}) {
  const [paused, setPaused] = useState(false);
  const snap = useSnapshot(sceneState);
  const smoothRef = useRef(0);
  const outerRef = useRef(); // the <group> you already had
  const innerRef = useRef(); // we’ll point this at the positioned child
  const positionRef = useRef(new THREE.Vector3());
  const [lights, setLights] = useState([]);
  const [levels, setLevels] = useState({});
  const meshTrackId = subs.length > 0 ? subs[0].id : null;

  // 2) **Narrow‐cast** to only the fields we need from visibleMap:
  const visible = visibleMap[meshTrackId]?.visible ?? false;

  const [ready, setReady] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showName, setShowName] = useState(false);
  const handleDoubleClick = () => {
    setShowDelete(true);
  };

  const handleRemove = () => {
    setShowDelete(false);
    removeMesh?.(name);
    if (sceneState.current === name) {
      sceneState.current = null;
    }
  };

  useLayoutEffect(() => {
    const outer = outerRef.current;
    if (outer && outer.children[0].children.length) {
      // assume the *first* child is the <group position=[…]> from your Part
      innerRef.current = outer.children[0].children[0];
      setReady(true);
    }
  }, []);

  function handleAnalysedLevel(subId, level) {
    setLevels((prev) => {
      // bail out if unchanged to avoid extra rerenders
      if (prev[subId] === level) return prev;
      return { ...prev, [subId]: level };
    });
  }
  const trackLevel = useMemo(() => {
    const vals = Object.values(levels);
    if (!vals.length) return 0;
    // e.g. use average
    return vals.reduce((sum, v) => sum + v, 0) / vals.length;
  }, [levels]);

  useEffect(() => {
    if (!outerRef.current) return;
    const arr = [];
    outerRef.current.traverse((obj) => {
      if (obj.isLight) arr.push(obj);
    });
    setLights(arr);
  }, []);

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

  const [cymbalMeshes, setCymbalMeshes] = useState([]);
  useEffect(() => {
    if (!outerRef.current) return;
    const arr = [];
    outerRef.current.traverse((obj) => {
      if (obj.isMesh && obj.material.name === 'cymbalMat') arr.push(obj);
    });
    setCymbalMeshes(arr);
  }, []);

  // every frame, use playLevel (a number!) to drive emissive
  useFrame((_, delta) => {
    if (!padMeshes.length && !cymbalMeshes.length && lights.length === 0)
      return;

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
      30, // attack/release speed
      delta
    );

    // Map 0→1 into 0→maxIntensity
    const intensity = THREE.MathUtils.lerp(2.52, 5, smoothRef.current);
    // console.log(intensity)
    padMeshes.forEach((m) => {
      // set to zero when smoothRef is zero → totally dark
      const hex = visibleMap[meshTrackId]?.color;
      if (hex) {
        m.material.emissive.set(hex);
        m.material.color.set(hex);
        m.material.blendEquation = THREE.SubtractiveBlending;
      }
      m.material.emissiveIntensity = intensity;
      // keep color proportional to level (or leave it white)
      m.material.emissive.setScalar(smoothRef.current * 2);
    });
    // console.log(playLevel)
    lights.forEach((light) => {
      const multiplier = light.userData?.intensityMultiplier ?? 1;
      const lightInt =
        THREE.MathUtils.lerp(0, 154, smoothRef.current) * multiplier;
      light.intensity = lightInt;

      if (!visibleMap) return;
      const hex = visibleMap[meshTrackId]?.color || '#ffffff';
      light.color.set(hex);
    });
    cymbalMeshes.forEach((m) => {
      // scale 0 → 3 feels about right; tweak to taste
      m.material.emissiveIntensity = THREE.MathUtils.lerp(
        0,
        50,
        smoothRef.current / 2
      );

      // don’t touch m.material.emissive!  The map already modulates it.
    });
  });

  // console.log('ORRRRR', outerRef.current.children[0].position)
  //outerRef.current.children[0]
  return (
    <group
      ref={outerRef}
      scale={5}
      name={name}
      onClick={(e) => {
        e.stopPropagation();
        sceneState.current = name;
        setShowName(!showName);
      }}
      onPointerOut={() => setShowName(false)}
      onContextMenu={(e) => {
        e.stopPropagation();
        if (snap.current === name) {
          sceneState.mode = (snap.mode + 1) % modes.length;
        }
      }}
      onDoubleClick={(e) => {
        e.stopPropagation(), handleDoubleClick();
      }}
    >
      {children}

      {(showDelete || showName) && (
        <Html
          distanceFactor={50}
          position={[
            outerRef.current?.children[0].position.x,
            1,
            outerRef.current?.children[0].position.z,
          ]}
          className='html-label'
        >
          <div
            style={{
              background: 'rgba(0,0,0,0.8)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              width: 'max-content',
            }}
          >
            {showDelete && (
              <div className='delete-tab'>
                <button
                  onClick={() => setShowDelete(false)}
                  className='delete-button'
                >
                  ✖
                </button>
                <span>
                  Remove <strong>{name}</strong>?
                </span>
                <button
                  onClick={handleRemove}
                  style={{
                    background: '#e74c3c',
                    color: '#fff',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>
            )}

            {showName && (
              <>
                <div>{name}</div>
              </>
            )}
          </div>
        </Html>
      )}
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

     
    </group>
  );
}
