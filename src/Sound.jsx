import { useLoader, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

function Sound({ url, on, paused, ...props }) {
  const sound = useRef();
  const { camera } = useThree();

  const buffer = useLoader(THREE.AudioLoader, url);
  const audioCtx = THREE.AudioContext.getContext();
  const [listener] = useState(() => new THREE.AudioListener());

  
  const dede = listener.context.createDelay(.5);

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

  const biquadFilter = listener.context.createBiquadFilter();
  const deGain = listener.context.createGain()
  useEffect(() => {
    biquadFilter.type = 'lowshelf';
    biquadFilter.frequency.setValueAtTime(1000, listener.context.currentTime);
    biquadFilter.gain.setValueAtTime(props.delayTime * -5, listener.context.currentTime);  
     dede.delayTime.setValueAtTime(
      props.delayTime,
      listener.context.currentTime
    );
    deGain.gain.setValueAtTime(props.delayTime , listener.context.currentTime);  
    dede.connect(deGain)
    sound.current.setFilter(dede)
    // sound.current.setFilter(biquadFilter);
  }, [props.delayTime]);
  // console.log()

  useEffect(() => {
    sound.current.setBuffer(buffer);
    sound.current.setRefDistance(3);
    sound.current.setLoop(true);
 

    camera.add(listener);
    return () => camera.remove(listener);
  }, []);


  return <positionalAudio ref={sound} args={[listener]} />;
}

export default Sound;
