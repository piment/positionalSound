// AudioContextProvider.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';

export const AudioContext = createContext();

export const AudioContextProvider = ({ children }) => {
  const [audioContext, setAudioContext] = useState(null);

  useEffect(() => {
    // Create a single AudioContext instance when the component mounts
    const context = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(context);

    // Clean up the AudioContext when the component unmounts
    return () => {
      context.close();
    };
  }, []);

  if (!audioContext) {
    // If AudioContext is not yet available, you can return a loading state
    return <div>Loading...</div>;
  }

  return (
    <AudioContext.Provider value={audioContext}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudioContext = () => {
  return useContext(AudioContext);
};
