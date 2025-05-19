// AudioContextProvider.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';

// Don’t name this the same as window.AudioContext
const AudioCtxContext = createContext(null);

export function AudioContextProvider({ children }) {
  const [audioContext, setAudioContext] = useState(null);

  useEffect(() => {
    // Create it once
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(ctx);

    return () => {
      // Clean up on unmount
      ctx.close();
    };
  }, []);

  // While it’s initializing you could show nothing or a spinner
  if (!audioContext) return null;

  return (
    <AudioCtxContext.Provider value={audioContext}>
      {children}
    </AudioCtxContext.Provider>
  );
}

export function useAudioContext() {
  const ctx = useContext(AudioCtxContext);
  if (!ctx) {
    throw new Error('useAudioContext must be used within an AudioContextProvider');
  }
  return ctx;
}
