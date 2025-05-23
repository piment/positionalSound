// Sound.jsx
import { useEffect, useRef } from 'react';
import { useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export default function Sound({
  url,
  on,
  paused,
  volume = 1,
  dist = 1,
  listener,
  convolver,
  sendLevel = 0,
}) {
  const soundRef = useRef();
  const buffer   = useLoader(THREE.AudioLoader, url);
  const { camera } = useThree();

  // wet send nodes
  const sendSrcRef  = useRef(null);
  const sendGainRef = useRef(null);

  // attach listener once
  useEffect(() => {
    camera.add(listener);
    return () => camera.remove(listener);
  }, [camera, listener]);

  // ─── DRY PATH ─────────────────────────────────
  useEffect(() => {
    const sound = soundRef.current;
    if (!sound || !buffer) return;


    const p = sound.panner;
    p.panningModel = 'equalpower';
    p.rolloffFactor = 0;

    sound.setBuffer(buffer);
    sound.setRefDistance(dist);
    sound.setLoop(true);

    // guard volume
    const vol = Number.isFinite(volume) ? volume : 1;
    sound.setVolume(vol);

    // playback
    if (on && !paused) {
      if (!sound.isPlaying) sound.play();
    } else {
      try { sound.stop(); } catch {}
    }
  }, [buffer, dist, volume, on, paused]);

  // ─── WET PATH (reverb send) ─────────────────────
  useEffect(() => {
    if (!buffer) return;
    const ctx = listener.context;

    // start or stop wet source
    if (on && !paused) {
      const src  = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop   = true;

      const gain = ctx.createGain();
      // guard sendLevel
      const sl = Number.isFinite(sendLevel) ? sendLevel : 0;
      gain.gain.setValueAtTime(sl, ctx.currentTime);

      src.connect(gain).connect(convolver);
      src.start(ctx.currentTime);

      sendSrcRef.current  = src;
      sendGainRef.current = gain;
    }

    return () => {
      const src  = sendSrcRef.current;
      const gain = sendGainRef.current;
      if (src) {
        try { src.stop(); } catch {}
        src.disconnect();
        sendSrcRef.current = null;
      }
      if (gain) {
        gain.disconnect();
        sendGainRef.current = null;
      }
    };
  }, [buffer, on, paused, convolver, listener]);

  // ─── UPDATE SEND LEVEL ─────────────────────────
  useEffect(() => {
    const gain = sendGainRef.current;
    if (gain) {
      const sl = Number.isFinite(sendLevel) ? sendLevel : 0;
      gain.gain.setValueAtTime(sl, listener.context.currentTime);
    }
  }, [sendLevel, listener]);

  return <positionalAudio ref={soundRef} args={[listener]} />;
}
