import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  TransformControls,
  ContactShadows,
  Text,
  Html,

} from '@react-three/drei';
import { proxy, useSnapshot } from 'valtio';
import * as THREE from 'three'
import './App.css';

import Sound from './Sound';


const modes = ['translate', 'rotate', 'scale'];
const state = proxy({ current: null, mode: 0 });



function Controls() {
  const snap = useSnapshot(state);
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

function ObjSound(props){
const [paused, setPaused]= useState(false)
  const snap = useSnapshot(state)
   const [mainVol, setMainVol] = useState(0.5)
  return(
    <mesh position={props.defPos} name={props.name} onDoubleClick={() => setPaused(!paused)}  onClick={(e) => (e.stopPropagation(), (state.current = props.name))}>
     <mesh>
    
      <sphereGeometry args={[2,12,2]}/>
      <meshBasicMaterial color={"#ff00ff"}/>
           <Sound  on={props.on} paused={paused} dist={props.dist}  delayTime={props.delay} url={props.url} mainVol={props.mainVol}/>
     </mesh>
     <Html>
 <div>
 {props.name}
      <input type="range"  min="0" max="1" value={mainVol} step="0.001"  onChange={(e) => setMainVol(e.target.value)}/>
      </div>
       {/* {props.name} */}
     </Html>

    </mesh>
  )
}


export default function App() {
const audioCont = new THREE.AudioContext()
  const [on, setOn] = useState(false)
  const [dTime, setDTime] = useState(0)
 let mainVol = 0.5
  return (
    <>
      <div
    onDoubleClick={() => setOn(!on)}
        style={{ width: '10vw', height: '10vh', backgroundColor: '#ff00ff' }}
      >
       Play / Pause (dbl click)
      </div>
      <div>
delayRange : 
      <input type="range"  min="0" max="1" value={dTime} step="0.001"  onChange={(e) => setDTime(e.target.value)}/>
      </div>
      {/* <div>
main : 
      <input type="range"  min="0" max="1" value={mainVol} step="0.001"  onChange={(e) => setMainVol(e.target.value)}/>
      </div> */}
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
   <ObjSound name="drums" url={'/motor/MOTOR DRUMS.mp3'} dist={15} defPos={[0,0,-5]} context={audioCont} on={on} delay={dTime} mainVol={mainVol}/>
   <ObjSound name="bass" url={'/motor/MOTOR - BASS - Groupe.mp3'} dist={20}  context={audioCont} on={on} delay={dTime} mainVol={mainVol}/>
   <ObjSound name="gtr1" url={'/motor/MOTOR - GTR X - Groupe.mp3'}dist={3}  context={audioCont}  on={on} delay={dTime} mainVol={mainVol}/>
   <ObjSound name="gtr2" url={'/motor/MOTOR - GTR ERW - Groupe.mp3'} dist={3} context={audioCont}  on={on} delay={dTime} mainVol={mainVol}/>
   <ObjSound name="keys" url={'/motor/MOTOR - KEYS - Groupe.mp3'} dist={3} context={audioCont}  on={on} delay={dTime} mainVol={mainVol}/>
   <ObjSound name="vox" url={'/motor/MOTOR VOX.mp3'} context={audioCont} dist={10} on={on} delay={dTime} mainVol={mainVol}/>
   <ObjSound name="RVB" url={'/motor/MOTOR-RVB.mp3'} context={audioCont} dist={100} on={on} delay={dTime} mainVol={mainVol}/>
   
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