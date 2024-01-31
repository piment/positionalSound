import React, { useRef, useEffect } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';

const PosAudio = ({ url, position, distance = 1 }) => {
  const audioRef = useRef();

  const actx = new THREE.AudioContext()

  // Load audio file
  const audioBuffer = useLoader(THREE.AudioLoader, url);
const listen = new THREE.AudioListener()

  useEffect(() => {
    if (audioBuffer) {
      // Create a positional audio object
      const positionalAudio = new THREE.PositionalAudio(listen);

      // Set the audio buffer to the positional audio
      positionalAudio.setBuffer(audioBuffer);

      // Set other properties
      positionalAudio.setRefDistance(distance);
      positionalAudio.setVolume(1); // Adjust volume if needed

      // Add the positional audio to the Three.js object
      audioRef.current.add(positionalAudio);

      // Start playing the audio
      positionalAudio.play();

      // Clean up on component unmount
      return () => {
        positionalAudio.stop();
        positionalAudio.disconnect();
      };
    }
  }, []);

  return <group position={position} ref={audioRef} />;
};

export default PosAudio;
