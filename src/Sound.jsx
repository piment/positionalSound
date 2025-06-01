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
  sendLevel = .2,
  playStartTime = 0,
  onAnalysedLevel,
  onAnalyserReady,
  onVolumeChange,
  trackId,
  masterTapGain,
  visible,
  // position,
  meshRef
}) {
  const buffer = useLoader(THREE.AudioLoader, url);
  const { camera, scene } = useThree();
  const audioCtx = listener.context;

  const soundRef = useRef(null);
      const pos = new THREE.Vector3();
  const tapGain = useMemo(() => audioCtx.createGain(), [audioCtx]);
  const analyser = useMemo(() => {
    const a = audioCtx.createAnalyser();
    a.fftSize = 4096;
    a.smoothingTimeConstant = 0.8;
    return a;
  }, [audioCtx]);

  const sendSrcRef = useRef(null);
  const sendGainRef = useRef(null);

  useEffect(() => {
    if (typeof onVolumeChange === 'function') {
      onVolumeChange(volume);
    }
  }, [volume, onVolumeChange]);
useEffect(() => {
  if (soundRef.current) {
    soundRef.current.setVolume(volume); // should react to volume prop changes
  }
}, [volume]);

  useEffect(() => {
    if (typeof onAnalyserReady === 'function') {
      onAnalyserReady(analyser);
    }
  }, [analyser, onAnalyserReady]);

  useEffect(() => {
    camera.add(listener);
    return () => camera.remove(listener);
  }, [camera, listener]);

useEffect(() => {
  if (!buffer || !listener || soundRef.current) return;

  const sound = new THREE.PositionalAudio(listener);
  soundRef.current = sound;

  sound.setBuffer(buffer);
  sound.setRefDistance(dist);
  sound.setLoop(true);
  sound.setVolume(volume);
  sound.panner.panningModel = 'equalpower';
  sound.panner.rolloffFactor = 0.005;
  sound.panner.coneInnerAngle = 360;
  sound.panner.coneOuterAngle = 360;

  // Initial position
  // if (position) sound.position.copy(position);

  // Audio node routing
  const gainNode = sound.getOutput();
  gainNode.connect(tapGain);
  tapGain.connect(analyser);
  analyser.connect(masterTapGain);

  // Add to scene only once
  scene.add(sound);

  // Callback
  onAnalyserReady?.(trackId, analyser, volume);
  onVolumeChange?.(trackId, volume);

  return () => {
    sound.stop();
    gainNode.disconnect();
    tapGain.disconnect();
    analyser.disconnect();
    scene.remove(sound);
  };
}, [buffer, dist, listener, masterTapGain]);

useEffect(() => {
  const sound = soundRef.current;
  if (!sound) return;

  sound.setVolume(volume);

  if (on && !paused) {
    if (!sound.isPlaying) {
      sound.play(0, playStartTime);
    }
  } else {
    try {
      sound.stop();
    } catch {}
  }

  const target = on && !paused && visible
    ? sound.gain.gain.value
    : 0;
  masterTapGain.gain.setValueAtTime(target, audioCtx.currentTime);
}, [on, paused, playStartTime, visible, volume, audioCtx, masterTapGain]);


  useEffect(() => {
    if (!buffer) return;
    const ctx = listener.context;
    const offset = Number.isFinite(playStartTime) ? playStartTime : 0;

    if (on && !paused) {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;

      const gain = ctx.createGain();
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
      }
      if (gain) gain.disconnect();
    };
  }, [buffer, on, paused, convolver, listener, playStartTime]);

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

  useFrame(() => {
    analyser.getByteFrequencyData(data);
    const sum = data.reduce((a, v) => a + v, 0);
    let level = sum / data.length / 255;
    level *= Number.isFinite(volume) ? volume : 1;
    level = Math.min(1, Math.max(0, level));
    onAnalysedLevel?.(level);

    if (soundRef.current && meshRef?.current) {
    const worldPos = new THREE.Vector3();
    meshRef.current.children[0].getWorldPosition(worldPos);
    soundRef.current.position.copy(worldPos);
    soundRef.current.updateMatrixWorld();
    // console.log(meshRef.current)
  }
  });

  return null; // Nothing rendered, audio is handled programmatically
}
