// Sound.jsx
import { useEffect, useRef, useMemo } from 'react';
import { useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export default function Sound({
  url,
  on,
  paused,
  volume = 1,
  dist = 1,
  audioCtx,
}) {
  const sound = useRef();
  const buffer = useLoader(THREE.AudioLoader, url);
  const { camera } = useThree();

  // Create one real listener
  const listener = useMemo(() => new THREE.AudioListener(), []);
  useEffect(() => {
    camera.add(listener);
    return () => void camera.remove(listener);
  }, [camera, listener]);
  

  // Whenever the buffer or play/volume props change:
  useEffect(() => {
    if (!sound.current || !buffer) return;
    sound.current.setBuffer(buffer);
    sound.current.setRefDistance(dist);
    sound.current.setLoop(true);
    sound.current.setVolume(volume);

    if (on && !paused) {
      if (!sound.current.isPlaying) sound.current.play();
    } else {
      sound.current.stop();
    }
  }, [buffer, dist, volume, on, paused]);

  return <positionalAudio ref={sound} args={[listener]} />;
}
