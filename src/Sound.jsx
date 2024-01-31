import { useLoader, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

function Sound({ url, on, paused, context, ...props }) {
  const sound = useRef();
  const { camera } = useThree();

  const buffer = useLoader(THREE.AudioLoader, url);

  const [listener] = useState(() => new THREE.AudioListener());

const audioNonPos = new THREE.Audio()

audioNonPos.buffer = buffer

audioNonPos.disconnect()

const delay = audioNonPos.context.createDelay(.5)

audioNonPos.connect(delay)


useEffect(() => {
  
  delay.connect(sound.current.getOutput())
  // sound.current.setBuffer(buffer);
  sound.current.setRefDistance(3);
  // sound.current.setLoop(true);

    camera.add(listener);
    return () => camera.remove(listener);
  }, []);


  return <positionalAudio ref={sound}  args={[listener]} />;
}

export default Sound;
