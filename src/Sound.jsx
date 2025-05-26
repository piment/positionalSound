// Sound.jsx
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
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
  playStartTime = 0,
    onAnalysedLevel,
}) {
  const soundRef = useRef();
  const buffer   = useLoader(THREE.AudioLoader, url);
  const { camera } = useThree();
  const audioCtx = listener.context;
  const analyser = useMemo(() => audioCtx.createAnalyser(), [audioCtx]);
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
        if (!sound.isPlaying) {
        // three.js Audio.play( delay, offset )
        sound.play(0, playStartTime);
            p.connect(analyser);
    analyser.connect(listener.getInput());
      }
    } else {
      try { sound.stop(); } catch {}
    }
  }, [buffer, dist, volume, on, paused, playStartTime]);

  // ─── WET PATH (reverb send) ─────────────────────
  useEffect(() => {
    if (!buffer) return;
    const ctx = listener.context;
    const offset = Number.isFinite(playStartTime) ? playStartTime : 0;
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
      src.start(ctx.currentTime, offset);

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
  }, [buffer, on, paused, convolver, listener,  playStartTime]);

  // ─── UPDATE SEND LEVEL ─────────────────────────
  useEffect(() => {
    const gain = sendGainRef.current;
    if (gain) {
      const sl = Number.isFinite(sendLevel) ? sendLevel : 0;
      gain.gain.setValueAtTime(sl, listener.context.currentTime);
    }
  }, [sendLevel, listener]);


const data = useMemo(
    () => new Uint8Array(analyser.frequencyBinCount),
    [analyser]
  );

  // each frame, sample and report level upstream
  useFrame(() => {
    analyser.getByteFrequencyData(data);
    // e.g. average magnitude normalized 0→1
    const sum = data.reduce((a, v) => a + v, 0);
    const avg = sum / data.length / 255;
    onAnalysedLevel?.(avg);
    // console.log(avg*10)
  });

  return <positionalAudio ref={soundRef} args={[listener]} />;
}
