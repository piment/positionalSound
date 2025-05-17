
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Drums } from './instruments/Drums';
import { Bass } from './instruments/Bass';

function Sound({ url, on,file, playTrigger,
  globalPlay,  paused, volume, context,dist, ...props }) {
  const sound = useRef();
  const analyserRef = useRef()
  const audioRef = useRef()
const audioDataArrayRef = useRef()
const souRef = useRef()
const gainRef = useRef();
  const { camera } = useThree();

  const buffer = useLoader(THREE.AudioLoader, url);

  const [listener] = useState(() => new THREE.AudioListener());


  const audioCtx = listener.context;
  const delayFx = audioCtx.createDelay();
const revFx = audioCtx.createConvolver()
const revGain = audioCtx.createGain()
const gainNode = audioCtx.createGain();

// audioCtx.connect(gainNode);
// gainNode.connect(analyser);
revFx.connect(revGain)
function loadBuffer(url, callback) {
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";

  request.onload = function () {
    audioCtx.decodeAudioData(request.response, function (buffer) {
      callback(buffer);
    });
  };

  request.send();
}

var impulseResponseBuffer = null;
const reverbNode = audioCtx.createConvolver();
function loadImpulseResponse() {
  loadBuffer("/reverb0_55-4-15000-1000.wav", function (buffer) {
    revFx.buffer = buffer;
  
  });
}
loadImpulseResponse();
  useEffect(() => {
///Play pause condition

    if (on) {
      sound.current.play();
      sound.current.connect(analyserRef.current)
    } else if (!on) {
      sound.current.pause();
    } 


/////  Toggle and mute each mesh separately
    if (paused) {
      sound.current.setVolume(0);
    } else if (!paused) {
      sound.current.setVolume(1);
    }
  }, [on, paused]);


  analyserRef.current = new AnalyserNode(listener.context)



  analyserRef.current.smoothingTimeConstant = 1;
  analyserRef.current.maxDecibels = -10
analyserRef.current.minDecibels = -55


  const mainVolume = audioCtx.createGain()
// useEffect(() =>{
revGain.connect(mainVolume)
  mainVolume.gain.setValueAtTime(props.mainVol, audioCtx.currentTime)
  revGain.gain.setValueAtTime(props.delayTime, audioCtx.currentTime);
  // gainNode.gain.setTargetAtTime(paused ? 0 : volume, now, 0.01);

// },[props.mainVol])
sound.current?.setVolume(volume)

// sound.current?.setFilter(mainVolume)
useEffect(()=>{

  // sound.current?.setVolume(props.mainVol*2)
},[props.mainVol])
///// Delay updating
 sound.current?.gain.connect(analyserRef.current)


  useEffect(() => {

    sound.current.setBuffer(buffer);

    sound.current.setRefDistance(dist);
    sound.current.setLoop(true);

    camera.add(listener);
    return () => camera.remove(listener);
  }, []);


   useEffect(() => {
       const s = sound.current;
       if (!s) return;
       // always reset to start
       try { s.stop(); } catch {}
       // if playing, play from zero
       if (globalPlay) {
         s.play();
       }
     }, [playTrigger, globalPlay]);
  return (<><positionalAudio ref={sound} args={[listener]} setDirectionalCone={[10,10,10]} castShadow/>

    
  </>);
}





export default Sound;
