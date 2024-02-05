import { useLoader, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

function Sound({ url, on, paused, context,dist, ...props }) {
  const sound = useRef();
  const { camera } = useThree();

  const buffer = useLoader(THREE.AudioLoader, url);

  const [listener] = useState(() => new THREE.AudioListener());


  const audioCtx = listener.context;
  const delayFx = audioCtx.createDelay();
const revFx = audioCtx.createConvolver()
const revGain = audioCtx.createGain()
const analyze = audioCtx.createAnalyser(audioCtx)
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




  const mainVolume = audioCtx.createGain()
// useEffect(() =>{
revGain.connect(mainVolume)
  mainVolume.gain.setValueAtTime(props.mainVol, audioCtx.currentTime)
  revGain.gain.setValueAtTime(props.delayTime, audioCtx.currentTime);
// },[props.mainVol])

// sound.current?.setFilter(mainVolume)
useEffect(()=>{

  sound.current?.setVolume(props.mainVol)
},[props.mainVol])
///// Delay updating

  // useEffect(() => {
  //   // sound.current.filter = revFx

  //   // revGain.connect(sound.current.getOutput());
  // }, [props.delayTime]);
console.log(mainVolume)
  useEffect(() => {
    /// do i really need the ref to do things? eventhough I have to set the buffer somewhere else,
    /// i've let the things as it was when i sent you the first mail
    sound.current.setBuffer(buffer);
    // sound.current.setDirectionalCone(1,1,1)
    // sound.current.filter.add(revGain)
    sound.current.setRefDistance(dist);
    sound.current.setLoop(true);

    camera.add(listener);
    return () => camera.remove(listener);
  }, []);


  //// args need an array, the junior I am doesn't get it hehe
  return <positionalAudio ref={sound} args={[listener]} setDirectionalCone={[10,10,10]}/>;
}

export default Sound;
