import { useLoader, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

function Sound({ url, on, paused, context, ...props }) {
  const sound = useRef();
  const { camera } = useThree();

  const buffer = useLoader(THREE.AudioLoader, url);

  const [listener] = useState(() => new THREE.AudioListener());

  const wet = new AudioBufferSourceNode(listener.context)
  const dede = listener.context.createDelay(.5);

// wet.setBuffer(buffer)

// console.log(wet)
const wetGain = listener.context.createGain()
// wetGain.connect(listener.context.destination)
  
// const s2 = listener.context.createBufferSource()
wet.buffer = buffer

// s2.connect(wet)
  useEffect(() => {
    if (on) {
      wet.start()
      wet.context.resume()
      // sound.current.play();
      // wet.play()
    } else if (!on) {
      // sound.current.pause();
      // wetGain.gain.value = 0
      wet.context.suspend()
      
    }

    if (paused) {
      sound.current.setVolume(0);
      
      // wetGain.gain.value = 0
      // click(true)
    } else if (!paused) {
      // wetGain.gain.value = 1
      sound.current.setVolume(1);
      // click(false)
    }
  }, [on, paused]);

  const biquadFilter = listener.context.createBiquadFilter();



  wet.connect(dede)

  useEffect(() => {
    biquadFilter.type = 'lowshelf';
    biquadFilter.frequency.setValueAtTime(1000, listener.context.currentTime);
    biquadFilter.gain.setValueAtTime(props.delayTime * -10, listener.context.currentTime);  
    
     dede.delayTime.setValueAtTime(
      props.delayTime,
      listener.context.currentTime
    );

    dede.connect(biquadFilter)
    biquadFilter.connect(listener.context.destination)
 
wet.connect(biquadFilter)

  sound.current.hasPlaybackControl= true
  sound.current.setNodeSource(wet)
  // sound.current.play()


}, [props.delayTime]);
// console.log()

useEffect(() => {
  // sound.current.setBuffer(buffer);
  sound.current.setRefDistance(3);
  // sound.current.setLoop(true);
wet.start()
wet.context.suspend()
wet.loop=true
 wet.hasPlaybackControl = true

    camera.add(listener);
    return () => camera.remove(listener);
  }, []);


  return <positionalAudio ref={sound}  args={[listener]} />;
}

export default Sound;
