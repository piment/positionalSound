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
import * as THREE from 'three'
import './App.css';
import { useAudioContext } from './AudioContextProvider';
import Sound from './Sound';
// Reactive state model, using Valtio ...
const modes = ['translate', 'rotate', 'scale'];
const state = proxy({ current: null, mode: 0 });



function Controls() {
  const snap = useSnapshot(state);
  const scene = useThree((state) => state.scene);
  console.log(scene)
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

function ObjSound(props){
const [paused, setPaused]= useState(false)
  const snap = useSnapshot(state)
  return(
    <mesh name={props.name} onDoubleClick={() => setPaused(!paused)}  onClick={(e) => (e.stopPropagation(), (state.current = props.name))}>
      <sphereGeometry args={[2,12,2]}/>
      <meshBasicMaterial color={"#ff00ff"}/>
           <Sound  on={props.on} paused={paused} listener={props.listener}  url={props.url}/>
    </mesh>
  )
}


export default function App() {
  // const audioCtx = new AudioContext();
  const [listener] = useState(() => new THREE.AudioListener())
  // console.log(listener.context.createConvolver())
  const [on, setOn] = useState(false)
  return (
    <>
      <div
    onDoubleClick={() => setOn(!on)}
        style={{ width: '10vw', height: '10vh', backgroundColor: '#ff00ff' }}
      >
        OLEEEEEE
      </div>
    <Canvas camera={{ position: [0, 5, 20], fov: 35 }} dpr={[1, 2]}>
      <pointLight position={[100, 100, 100]} intensity={0.8} />
      <hemisphereLight
        color='#ffffff'
        groundColor='#b9b9b9'
        position={[-7, 25, 13]}
        intensity={0.85}
      />
      <Suspense fallback={null}>
        <group position={[0, 0, 0]}>
   <ObjSound name="gtr" url={'/07_ElecGtr2.mp3'} listener={listener} on={on}/>
   <ObjSound name="kick" url={'/01_Kick.mp3'} listener={listener} on={on}/>
   <ObjSound name="bass" url={'/05_Bass.mp3'} listener={listener} on={on}/>
   <ObjSound name="vox" url={'/09_LeadVox.mp3'} listener={listener} on={on}/>
          <ContactShadows
            rotation-x={Math.PI / 2}
            position={[0, -35, 0]}
            opacity={0.25}
            width={200}
            height={200}
            blur={1}
            far={50}
          />
        </group>
      </Suspense>
      <Controls />
    </Canvas></>
  );
}