import { useLoader, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

function Sound({ url, on, paused, ...props }) {
  const sound = useRef();
  const { camera } = useThree();

  const buffer = useLoader(THREE.AudioLoader, url);
  const audioCtx = THREE.AudioContext.getContext();
  const [listener] = useState(() => new THREE.AudioListener());

  const dede = audioCtx.createDelay();

  useEffect(() => {
    if (on) {
      sound.current.play();
    } else if (!on) {
      sound.current.pause();
    }

    if (paused) {
      sound.current.setVolume(0);
      // click(true)
    } else if (!paused) {
      sound.current.setVolume(1);
      // click(false)
    }
  }, [on, paused]);


  useEffect(() => {},[props.delayTime])
  // console.log()

  useEffect(() => {
    sound.current.setBuffer(buffer);
    sound.current.setRefDistance(3);
    sound.current.setLoop(true);
    
    camera.add(listener);
    return () => camera.remove(listener);

  }, []);


  useEffect(() => {
    const soundOut = sound.current.getOutput();
    soundOut.connect(dede);
    soundOut.connect(audioCtx.destination);
    //  console.log();
    dede.delayTime.setValueAtTime(props.delayTime, audioCtx.currentTime);
    dede.connect(audioCtx.destination);},[
    props.delayTime
  ])


  return <positionalAudio ref={sound} args={[listener]} context={audioCtx} />;
}

export default Sound;
