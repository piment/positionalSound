import React, { useRef, useState } from 'react';
import { useSnapshot, proxy } from 'valtio';
import { Html, OrbitControls, TransformControls } from '@react-three/drei';
import Sound from './Sound';
import { useThree } from '@react-three/fiber';

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
}) {
  const groupRef = useRef();
  const [paused, setPaused] = useState(false);
  const snap = useSnapshot(sceneState);

  return (
    <group
      ref={groupRef}
      position={defPos}
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
      {/* render the visual */}
      {children}

      {/* audio nodes */}
      {subs.map((sub, idx) => (
        <Sound
          key={sub.id}
          meshRef={groupRef}
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
