import React, { createContext, useContext, useState, useMemo } from 'react';
import { useAudioContext } from './AudioContextProvider';

const AudioBufferCacheContext = createContext();

export function AudioBufferCacheProvider({ children }) {
  const audioCtx = useAudioContext();
  const [cache] = useState(() => new Map());

  const loadBuffer = async (url) => {
    if (cache.has(url)) return cache.get(url);
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    cache.set(url, audioBuffer);
    return audioBuffer;
  };

  const value = useMemo(() => ({ loadBuffer }), [cache, audioCtx]);
  return (
    <AudioBufferCacheContext.Provider value={value}>
      {children}
    </AudioBufferCacheContext.Provider>
  );
}

export function useBufferCache() {
  const ctx = useContext(AudioBufferCacheContext);
  if (!ctx) throw new Error('useBufferCache must be used inside AudioBufferCacheProvider');
  return ctx;
}
