import { Box } from '@react-three/drei';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

function Sound({ url, on, paused, context,dist, ...props }) {
  const sound = useRef();
  const analyserRef = useRef()
  const audioRef = useRef()
const audioDataArrayRef = useRef()
const souRef = useRef()

  const { camera } = useThree();

  const buffer = useLoader(THREE.AudioLoader, url);

  const [listener] = useState(() => new THREE.AudioListener());


  const audioCtx = listener.context;
  const delayFx = audioCtx.createDelay();
const revFx = audioCtx.createConvolver()
const revGain = audioCtx.createGain()

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

  const bufferLength = analyserRef.current.frequencyBinCount;
  analyserRef.current.fftSize = 32
  const dataArray = new Uint8Array(bufferLength);
  analyserRef.current.getByteTimeDomainData(dataArray);

  analyserRef.current.smoothingTimeConstant = 1;
  analyserRef.current.maxDecibels = -20
analyserRef.current.minDecibels = -25


  const mainVolume = audioCtx.createGain()
// useEffect(() =>{
revGain.connect(mainVolume)
  mainVolume.gain.setValueAtTime(props.mainVol, audioCtx.currentTime)
  revGain.gain.setValueAtTime(props.delayTime, audioCtx.currentTime);
// },[props.mainVol])
sound.current?.setVolume(props.mainVol*2)

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

  const drawVisualization = () => {
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteTimeDomainData(dataArray);
    audioDataArrayRef.current = dataArray;

    
    if (audioRef.current && on) {
      requestAnimationFrame(drawVisualization);
    }
  };
drawVisualization()

  return (<><positionalAudio ref={sound} args={[listener]} setDirectionalCone={[10,10,10]} castShadow/>
         <Visualizer3D audioDataArray={audioDataArrayRef} audioRef={audioRef} isPlaying={on} />
    
  </>);
}




const Visualizer3D = ({ audioDataArray, audioRef, isPlaying }) => {
  // console.log(audioDataArray, isPlaying)
  let averageVolume = 0;

// Update the average volume using the data obtained from the audio analyzer

  // Calculate the sum of all frequency values
 
  useFrame((state) => {
    const dataArray = audioDataArray.current;
     const sum = dataArray.reduce((acc, val) => acc + val, 0);
  // Calculate the average volume
  averageVolume = sum / dataArray.length;


 
  const flickerIntensity = averageVolume / 255; // Normalize the volume to a range between 0 and 1

    // console.log(dataArray.length)
// console.log(dataArray[2] -128)
    if (audioRef.current && isPlaying) {
      // audioRef.current.scale.x = (2 * flickerIntensity )/2
      // audioRef.current.scale.y = (2 * flickerIntensity)/2
      // audioRef.current.scale.z = (2 * flickerIntensity)/2
      // audioRef.current.position.y = -1 + dataArray[0] / 256;
      // audioRef.current.material.emissiveIntensity = 1*( dataArray[0]-128)/50
      // audioRef.current.material.emissiveIntensity = -.5 + (flickerIntensity*1.5 )

    }
  });
  return (
<>
    {/* <ambientLight /> */}
    <pointLight position={[10, 10, 10]} castShadow/>
    <mesh ref={audioRef} position={[0, 0, 0]} visible={true} castShadow receiveShadow>

    <boxGeometry  args={[1, 1, 1]}   />
    <meshStandardMaterial color={"#ff00ff"} emissive={"#000000"} roughness={0.5}  metalness={.51} />
    </mesh>
  
</>
    )
    // return null;
  };
export default Sound;
