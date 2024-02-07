import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  TransformControls,
  ContactShadows,
  Text,
  Html,
  Effects,


} from '@react-three/drei';
import { proxy, useSnapshot } from 'valtio';
import * as THREE from 'three'
import './App.css';

import Sound from './Sound';
import EnvComp from './EnvComp';
import { Bloom, EffectComposer, N8AO } from '@react-three/postprocessing';


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
    
      {/* <sphereGeometry args={[2,12,2]}/> */}
      {/* <meshBasicMaterial color={"#ff00ff"}/> */}
           <Sound  on={props.on} paused={paused} dist={props.dist}  delayTime={props.delay} url={props.url} mainVol={mainVol}/>
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

    <Canvas  camera={{ position: [0, 5, 20], fov: 35 }} dpr={[1, 2]} shadows>
      <pointLight position={[5, 10, 5]} intensity={50.8} castShadow/>

      {/* <Stage> */}

    <EnvComp/>
 
      <Suspense fallback={null}>
        <group position={[0, 0, 0]}>
   <ObjSound name="drums" url={'/motor/MOTOR DRUMS.mp3'} dist={15} defPos={[0,0,-5]} context={audioCont} on={on} delay={dTime} />
   <ObjSound name="bass" url={'/motor/MOTOR - BASS - Groupe.mp3'} dist={20}  context={audioCont} on={on} delay={dTime} />
   <ObjSound name="gtr1" url={'/motor/MOTOR - GTR X - Groupe.mp3'}dist={10}  context={audioCont}  on={on} delay={dTime} />
   <ObjSound name="gtr2" url={'/motor/MOTOR - GTR ERW - Groupe.mp3'} dist={10} context={audioCont}  on={on} delay={dTime} />
   <ObjSound name="keys" url={'/motor/MOTOR - KEYS - Groupe.mp3'} dist={10} context={audioCont}  on={on} delay={dTime} />
   <ObjSound name="vox" url={'/motor/MOTOR VOX.mp3'} context={audioCont} dist={100} on={on} delay={dTime} />
   <ObjSound name="RVB" url={'/motor/MOTOR-RVB.mp3'} context={audioCont} dist={100} on={on} delay={dTime} />
   {/* <Visualizer3D audioDataArray={audioDataArrayRef} audioRef={audioRef} isPlaying={isPlaying} /> */}
    
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
      <EffectComposer disableNormalPass >
            <N8AO
              halfRes
              color='black'
              aoRadius={2}
              intensity={1}
              aoSamples={6}
              denoiseSamples={4}
            />
     <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} intensity={2}/>
          </EffectComposer>
            
            {/* </Stage> */}
      <Controls />

    </Canvas></>
  );
}