import { useRef, useCallback } from 'react';

export function useBufferCache(audioCtx) {
  const cache = useRef({});

  const loadBuffer = useCallback(async (url) => {
    if (cache.current[url]) return cache.current[url];

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    cache.current[url] = decoded;
    return decoded;
  }, [audioCtx]);

  return { loadBuffer, cache: cache.current };
}
