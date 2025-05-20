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

  // these refs hold our wet‐send nodes
  const sendSrcRef  = useRef(null);
  const sendGainRef = useRef(null);

  // attach the shared listener once
  useEffect(() => {
    camera.add(listener);
    return () => void camera.remove(listener);
  }, [camera, listener]);

  // ─── DRY (positional) PATH ───────────────────────
  useEffect(() => {
    const sound = soundRef.current;
    if (!sound || !buffer) return;

    // configure the PannerNode
    const p = sound.panner;
    p.panningModel = 'equalpower';
    p.rolloffFactor = 0;

    // set up the buffer and volume
    sound.setBuffer(buffer);
    sound.setRefDistance(dist);
    sound.setLoop(true);
    sound.setVolume(volume);

    // play or stop the dry path
    if (on && !paused) sound.play();
    else              sound.stop();
  }, [buffer, dist, volume, on, paused]);

  // ─── WET (reverb send) PATH ─────────────────────
  useEffect(() => {
    if (!buffer) return;
    const ctx = listener.context;

    // start the wet send only when playback starts
    if (on && !paused) {
      const src  = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop   = true;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(sendLevel, ctx.currentTime);

      src.connect(gain).connect(convolver);
      src.start(ctx.currentTime);

      sendSrcRef.current  = src;
      sendGainRef.current = gain;
    }

    // cleanup when stopping or unmounting
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

  // ─── JUST UPDATE SEND GAIN (no restart) ─────────
  useEffect(() => {
    const gain = sendGainRef.current;
    if (gain) {
      gain.gain.setValueAtTime(sendLevel, listener.context.currentTime);
    }
  }, [sendLevel, listener]);

  return <positionalAudio ref={soundRef} args={[listener]} />;
}
