import React, { createContext, useContext, useMemo } from 'react';
import * as THREE from 'three';

const AudioContextContext = createContext(null);
const ListenerContext = createContext(null);

export function AudioContextProvider({ children }) {
  const listener = useMemo(() => new THREE.AudioListener(), []);
  const audioContext = listener.context;

  return (
    <AudioContextContext.Provider value={audioContext}>
      <ListenerContext.Provider value={listener}>
        {children}
      </ListenerContext.Provider>
    </AudioContextContext.Provider>
  );
}

export function useAudioContext() {
  return useContext(AudioContextContext);
}

export function useAudioListener() {
  return useContext(ListenerContext);
}
