import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export default function Sound({
  url,
  buffer,
  on,
  paused,
  volume = 1,
  dist = 5,
  listener,
  convolver,
  sendLevel = 0.2,
  playStartTime = 0,
  onAnalysedLevel,
  onAnalyserReady,
  onVolumeChange,
  trackId,
  masterTapGain,
  visible,
  meshRef,
  pauseTime,
  mainDuration,
  onMainEnded,
  isMain = false,
  onNodeReady
}) {
  const { camera, scene } = useThree();
  const audioCtx = listener.context;

  const soundRef = useRef(null);
  const drySrcRef = useRef(null);
  const sendSrcRef = useRef(null);
  const sendGainRef = useRef(null);

  const tapGain = useMemo(() => audioCtx.createGain(), [audioCtx]);
  const analyser = useMemo(() => {
    const a = audioCtx.createAnalyser();
    a.fftSize = 4096;
    a.smoothingTimeConstant = 0.8;
    return a;
  }, [audioCtx]);

  // Track audio level for visuals
  const data = useMemo(() => new Uint8Array(analyser.frequencyBinCount), [analyser]);

  useEffect(() => {
    if (typeof onAnalyserReady === 'function') {
      onAnalyserReady(trackId, analyser);
    }
  }, [analyser, onAnalyserReady, trackId]);

  // useEffect(() => {
  //   if (typeof onVolumeChange === 'function') {
  //     onVolumeChange(trackId, volume);
  //   }
  // }, [volume, onVolumeChange, trackId]);

  // Ensure listener is attached to camera
  useEffect(() => {
    camera.add(listener);
    return () => camera.remove(listener);
  }, [camera, listener]);

  // Clean up any audio nodes
const stopAndCleanup = () => {
  // try {
  //   drySrcRef.current?.stop?.();
  // } catch (e) {
  //   console.warn('Dry src stop failed:', e);
  // }
  try {
    drySrcRef.current?.disconnect?.();
  } catch (e) {
    console.warn('Dry src disconnect failed:', e);
  }

  try {
    sendSrcRef.current?.stop?.();
  } catch (e) {
    console.warn('Send src stop failed:', e);
  }
  try {
    sendSrcRef.current?.disconnect?.();
  } catch (e) {
    console.warn('Send src disconnect failed:', e);
  }

  try {
    sendGainRef.current?.disconnect?.();
  } catch (e) {
    console.warn('Send gain disconnect failed:', e);
  }

  // if (soundRef.current) {
  //   try {
  //     soundRef.current.stop();
  //   } catch {}
  //   scene.remove(soundRef.current);
  //   soundRef.current = null;
  // }

  drySrcRef.current = null;
  sendSrcRef.current = null;
  sendGainRef.current = null;
};

  // Playback logic (dry positional + send bus)
  useEffect(() => {
    stopAndCleanup();

    if (!on || paused || !buffer || !listener) return;

    // Dry positional audio
const drySound = new THREE.PositionalAudio(listener);
drySound.setRefDistance(dist);
drySound.setVolume(volume);
drySound.panner.panningModel = 'equalpower';
drySound.panner.rolloffFactor = 0.05;
    // drySound.panner.coneInnerAngle = 360;
    // drySound.panner.coneOuterAngle = 360;

    // Position the sound at mesh
    if (meshRef?.current?.children?.[0]) {
      const pos = new THREE.Vector3();
      meshRef.current.children[0].getWorldPosition(pos);
      drySound.position.copy(pos);
    }

    // Routing
const dryOutput = drySound.getOutput();
dryOutput.connect(tapGain);
tapGain.connect(analyser);
analyser.connect(masterTapGain);

scene.add(drySound);

const startDelay = pauseTime === 0 ? .5 : 0;
console.log(playStartTime)
// Apply offset correctly
const offset = Number.isFinite(pauseTime) ? pauseTime : playStartTime || 0;
const sourceNode = audioCtx.createBufferSource();
sourceNode.buffer = buffer;
sourceNode.loop = false;
drySound.setNodeSource(sourceNode); // ⬅️ critical
sourceNode.start(audioCtx.currentTime + startDelay, offset);

if (typeof onNodeReady === 'function') {
  onNodeReady(trackId, sourceNode);
}
// soundRef.current = drySound;
soundRef.current = drySound;
drySrcRef.current = drySound; // keep reference for cleanup

    // Send (reverb bus) audio
    const sendSource = audioCtx.createBufferSource();
    sendSource.buffer = buffer;
    sendSource.loop = false;

  const sendGain = audioCtx.createGain();
sendGain.gain.setValueAtTime(sendLevel, audioCtx.currentTime);
sendGainRef.current = sendGain;

sendSource.connect(sendGain).connect(convolver);
sendSource.start(audioCtx.currentTime + startDelay, offset);


  },[
  on,
  paused,
  buffer,
  listener,
  convolver,
  playStartTime,
  pauseTime,
  dist,
  masterTapGain,
  scene,
  meshRef,

  // onMainEnded,
]);
useEffect(() => {
  const offset = Number.isFinite(pauseTime) ? pauseTime : playStartTime || 0;
  if (isMain && buffer) {
    const remaining = buffer.duration - offset;
    const timeout = setTimeout(() => {
      if (on && !paused) {
        onMainEnded?.(); // ✅ now stable
      }
    }, remaining * 1000);

    return () => clearTimeout(timeout);
  }
}, [isMain, buffer,  on, paused, onMainEnded]);
useEffect(() => {
  if (soundRef.current) {
    soundRef.current.setVolume(volume);
  }
}, [volume]);
  // Update send level dynamically
  useEffect(() => {
    if (sendGainRef.current) {
      sendGainRef.current.gain.setValueAtTime(sendLevel, audioCtx.currentTime);
    }
  }, [sendLevel, audioCtx]);

  // Animate and update positional audio
  useFrame(() => {
    if (analyser) {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
      const level = Math.min(1, Math.max(0, (avg / 255) * volume));
      onAnalysedLevel?.(level);
    }

    if (soundRef.current && meshRef?.current?.children?.[0]) {
      const pos = new THREE.Vector3();
      meshRef.current.children[0].getWorldPosition(pos);
      soundRef.current.position.copy(pos);
    }
    // console.log(audioCtx.currentTime)
  });

  return null;
}
