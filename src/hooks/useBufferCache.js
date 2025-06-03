import { useRef } from 'react';

export function useBufferCache(audioCtx) {
  const cacheRef = useRef({});

  const loadBuffer = async (url) => {
    if (cacheRef.current[url]) return cacheRef.current[url];
    const data = await fetch(url).then((res) => res.arrayBuffer());
    const decoded = await audioCtx.decodeAudioData(data);
    cacheRef.current[url] = decoded;
    return decoded;
  };

  const clearBuffer = (url) => {
    delete cacheRef.current[url];
  };

  const clearAllBuffers = () => {
    cacheRef.current = {};
  };

  return {
    loadBuffer,
    clearBuffer,
    clearAllBuffers,
    cache: cacheRef.current,
  };
}
