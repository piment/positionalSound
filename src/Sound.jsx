import { useLoader, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

function Sound({ url, on, paused, context, ...props }) {
  const sound = useRef();
  const { camera } = useThree();

  const buffer = useLoader(THREE.AudioLoader, url);

  const [listener] = useState(() => new THREE.AudioListener());


  const audioCtx = listener.context;
  const delayFx = audioCtx.createDelay();


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


///// Delay updating

  useEffect(() => {
    delayFx.delayTime.setValueAtTime(props.delayTime, audioCtx.currentTime);

    delayFx.connect(audioCtx.destination);
  }, [props.delayTime]);

  useEffect(() => {
    /// do i really need the ref to do things? eventhough I have to set the buffer somewhere else,
    /// i've let the things as it was when i sent you the first mail
    sound.current.setBuffer(buffer);
    sound.current.setRefDistance(3);
    sound.current.setLoop(true);

    camera.add(listener);
    return () => camera.remove(listener);
  }, []);


  //// args need an array, the junior I am doesn't get it hehe
  return <positionalAudio ref={sound} args={[listener]} />;
}

export default Sound;
