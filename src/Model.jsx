import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  TransformControls,
  ContactShadows,
  useGLTF,
  useCursor,
  PositionalAudio,
} from '@react-three/drei';
import { proxy, useSnapshot } from 'valtio';
import './App.css';
// Reactive state model, using Valtio ...
const modes = ['translate', 'rotate', 'scale'];
const state = proxy({ current: null, mode: 0 });










export default function Model({ name, url, distance,playPauseState, stopAll, ...props }) {
  const trackRef = useRef();
  const snap = useSnapshot(state);

  const { nodes } = useGLTF('/compressed.glb');
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const toggleTrack = () => {
    
    if (trackRef.current.getVolume() !== 0 || playPauseState ) {
      trackRef.current.setVolume(0);
      // click(true)
    } else if (trackRef.current.getVolume() === 0 || !playPauseState) {
      trackRef.current.setVolume(1);
      // click(false)
    }
  };
  // useEffect(() => {

  //   toggleTrack()
    
  // },[playPauseState])
 

  return (
    <mesh
   
      onClick={(e) => (e.stopPropagation(), (state.current = name))}

      onPointerMissed={(e) => e.type === 'click' && (state.current = null)}

      onContextMenu={(e) =>
        snap.current === name &&
        (e.stopPropagation(), (state.mode = (snap.mode + 1) % modes.length))
      }
      onPointerOver={(e) => (e.stopPropagation(), setHovered(true))}
      onPointerOut={(e) => setHovered(false)}
      onDoubleClick={toggleTrack}
      name={name}
      geometry={nodes[name].geometry}
      material={nodes[name].material}
      material-color={snap.current === name ? '#ff6080' : 'white'}
      {...props}
      dispose={null}
    >
      {url && (
        <PositionalAudio
          ref={trackRef}
          // autoplay={true}
          autoplay={playPauseState}
          loop
          url={url}
          distance={distance*2}
        />
      )}
    </mesh>
  );
}
