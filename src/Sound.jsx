// Sound.jsx
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSelector } from 'react-redux';

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
  // onAnalysedLevel,
  onAnalyserReady,
  onVolumeChange,
  trackId,
    masterTapGain,   
  visible,
}) {
  const soundRef = useRef();
  const buffer = useLoader(THREE.AudioLoader, url);
  const { camera } = useThree();
  const audioCtx = listener.context;
  // const analyser = useMemo(() => audioCtx.createAnalyser(), [audioCtx]);
  const tapGain = useMemo(() => audioCtx.createGain(), [audioCtx]);
  // start with tapGain muted
  // tapGain.gain.value = 1;
  const analyser = useMemo(() => {
    const a = audioCtx.createAnalyser()
    a.fftSize = 1024
    a.smoothingTimeConstant = 0.8
    return a
  }, [audioCtx])
  // wet send nodes
  const sendSrcRef = useRef(null);
  const sendGainRef = useRef(null);
  const isConnected = useRef(false);

  // const visible = useSelector(
  //   (state) => state.trackSettings[trackId]?.visible ?? true 
  // );
  useEffect(() => {
    if (typeof onVolumeChange === 'function') {
      onVolumeChange(volume)
    }
  }, [volume, onVolumeChange])

  //  useEffect(() => {
  //   if (typeof onAnalyserReady === 'function') {
  //     onAnalyserReady(analyser)
  //   }
  // }, [analyser, onAnalyserReady])

  // attach listener once
  useEffect(() => {
    camera.add(listener);
    return () => camera.remove(listener);
  }, [camera, listener]);

  // console.log(visible);
  // ─── DRY PATH ─────────────────────────────────
  // ─── Mount-only effect: wire the tap once ───────────────────────
  useEffect(() => {
    const sound = soundRef.current;
    if (!sound || !buffer) return;

    const p = sound.panner;
    p.panningModel = 'equalpower';
    // p.panningModel = 'HRTF'
    p.rolloffFactor = 0.005;

    sound.setBuffer(buffer);
    sound.setRefDistance(dist);
    sound.setLoop(true);
sound.setVolume(volume);
    // guard volume
    const vol = Number.isFinite(volume) ? volume : 1;
    sound.setVolume(vol);
    const gainNode = sound.getOutput();

    // wire once: gainNode → tapGain → analyser → listener.getInput()
    gainNode.connect(tapGain)
    tapGain.connect(analyser)
     analyser.connect(masterTapGain)       // tap branch for analysis

 
    // analyser.connect(listener.getInput())
// console.log("VOOOOOOL", volume)
    // let App know about your analyser
    onAnalyserReady?.(trackId, analyser, volume)
    onVolumeChange?.(trackId, volume)
   return () => {
      // gainNode.disconnect(masterTapGain)
    }

  }, [buffer, dist, volume, analyser, onAnalyserReady, onVolumeChange, listener, masterTapGain])

  // ─── Playback + gate effect: play/stop & mute/unmute tap ───────
  useEffect(() => {
    const sound = soundRef.current
    if (!sound) return

    //  playback control
    if (on && !paused) {
      if (!sound.isPlaying) sound.play(0, playStartTime)
    } else {
      try { sound.stop() } catch {}
    }

    // gate the analyser‐tap via gain
   const target = on && !paused && visible
  ? sound.gain.gain.value
  : 0
masterTapGain.gain.setValueAtTime(target, audioCtx.currentTime)
    
// console.log(sound.gain.gain.value)
    // console.log(tapGain.gain)
  }, [on, paused, playStartTime, visible, audioCtx, masterTapGain, volume])

  // ─── WET PATH (reverb send) ─────────────────────
  useEffect(() => {
    if (!buffer) return;
    const ctx = listener.context;
    const offset = Number.isFinite(playStartTime) ? playStartTime : 0;
    // start or stop wet source
    if (on && !paused) {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;

      const gain = ctx.createGain();
      // guard sendLevel
      const sl = Number.isFinite(sendLevel) ? sendLevel : 0;
      gain.gain.setValueAtTime(sl, ctx.currentTime);

      src.connect(gain).connect(convolver);
      src.start(ctx.currentTime, offset);

      sendSrcRef.current = src;
      sendGainRef.current = gain;
    }

    return () => {
      const src = sendSrcRef.current;
      const gain = sendGainRef.current;
      if (src) {
        try {
          src.stop();
        } catch {}
        src.disconnect();
        sendSrcRef.current = null;
      }
      if (gain) {
        gain.disconnect();
        sendGainRef.current = null;
      }
    };
  }, [buffer, on, paused, convolver, listener, playStartTime]);

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
    let level = sum / data.length / 255;

    // bake in the volume slider
    level *= Number.isFinite(volume) ? volume : 1;

    // clamp 0→1
    level = Math.min(1, Math.max(0, level));

    // onAnalysedLevel?.(level);
    // console.log(avg*10)
  });

  return <positionalAudio ref={soundRef} args={[listener]} />;
}
