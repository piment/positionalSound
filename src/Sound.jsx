// Sound.jsx
import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export default function Sound({
  buffer,
  on,
  paused,
  volume = 1,
  dist = 5,                // used for PositionalAudio refDistance
  listener,
  convolver,
  sendLevel = 0.2,
  playStartTime = 0,
  onAnalysedLevel,
  onAnalyserReady,
  onVolumeChange,
  onSendLevelChange,
  trackId,
  masterTapGain,
  visible,
  meshRef,
  pauseTime,
  mainDuration,
  onMainEnded,
  isMain = false,
  onNodeReady,
  pan = 0,                 // stereo pan for unassigned
}) {
  const { camera, scene } = useThree();
  const audioCtx = listener.context;

  // Refs for our nodes:
  const threeAudioRef = useRef(null);    // will hold THREE.PositionalAudio if assigned
  const sourceRef = useRef(null);        // always the BufferSource for “dry”
  const stereoSourceRef = useRef(null);  // BufferSource for “stereo” path if unassigned
  const stereoPannerRef = useRef(null);  // holds StereoPannerNode if unassigned
  const gainRef = useRef(null);          // GainNode for volume
  const sendGainRef = useRef(null);      // GainNode for sendLevel
  const analyserNodeRef = useRef(null);  // AnalyserNode for visuals

  // Create one AnalyserNode for this track
  const analyserNode = useMemo(() => {
    const a = audioCtx.createAnalyser();
    a.fftSize = 4096;
    a.smoothingTimeConstant = 0.8;
    return a;
  }, [audioCtx]);

  // U-array for analyser data
  const dataArray = useMemo(
    () => new Uint8Array(analyserNode.frequencyBinCount),
    [analyserNode]
  );

  // Notify parent that analyser is ready
  useEffect(() => {
    if (typeof onAnalyserReady === 'function') {
      onAnalyserReady(trackId, analyserNode);
    }
    analyserNodeRef.current = analyserNode;
  }, [analyserNode, onAnalyserReady, trackId]);

  // Ensure listener (THREE.AudioListener) is attached to camera
  useEffect(() => {
    camera.add(listener);
    return () => {
      camera.remove(listener);
    };
  }, [camera, listener]);

  // A safe cleanup that only stops/disconnects if the node exists:
  const stopAndCleanup = () => {
    // 1) If we used THREE.PositionalAudio:
    if (threeAudioRef.current) {
      try {
        // underlying audio source is stopped/removed by Three.js automatically,
        // but we can explicitly disconnect here:
        threeAudioRef.current.disconnect();
      } catch {}
      try {
        scene.remove(threeAudioRef.current);
      } catch {}
      threeAudioRef.current = null;
    }

    // 2) If we used a raw BufferSource for stereo/unassigned
    if (stereoSourceRef.current) {
      try {
        stereoSourceRef.current.stop();
      } catch {}
      try {
        stereoSourceRef.current.disconnect();
      } catch {}
      stereoSourceRef.current = null;
    }

    // 3) If we used a raw BufferSource for the PositionalAudio’s “setNodeSource” path:
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {}
      try {
        sourceRef.current.disconnect();
      } catch {}
      sourceRef.current = null;
    }

    // 4) Disconnect gain
    if (gainRef.current) {
      try {
        gainRef.current.disconnect();
      } catch {}
      gainRef.current = null;
    }

    // 5) Disconnect sendGain
    if (sendGainRef.current) {
      try {
        sendGainRef.current.disconnect();
      } catch {}
      sendGainRef.current = null;
    }

    // 6) Disconnect stereoPanner
    if (stereoPannerRef.current) {
      try {
        stereoPannerRef.current.disconnect();
      } catch {}
      stereoPannerRef.current = null;
    }

    // 7) Disconnect analyser (we’ll reconnect in the next effect)
    if (analyserNodeRef.current) {
      try {
        analyserNodeRef.current.disconnect();
      } catch {}
    }
  };

  // Main playback / node‐creation effect
  useEffect(() => {
    // First, clean up any existing nodes
    stopAndCleanup();

    if (!on || paused || !buffer || !listener) {
      return;
    }

    // Compute offset into buffer
    const offset = Number.isFinite(pauseTime) ? pauseTime : playStartTime || 0;
    const startDelay = pauseTime === 0 ? 0.01 : 0;

    // ─── DRY PATH: either PositionalAudio (assigned) or StereoPanner (unassigned) ───
    if (meshRef?.current?.children?.[0]) {
      // ─── ASSIGNED: use THREE.PositionalAudio ─────────────────────────────────
      const threeAudio = new THREE.PositionalAudio(listener);
      threeAudioRef.current = threeAudio;

      // Configure the PannerNode inside the PositionalAudio
      threeAudio.setRefDistance(dist);
      threeAudio.setRolloffFactor(0.05);
      threeAudio.panner.panningModel = 'equalpower';
      threeAudio.panner.distanceModel = 'inverse';
      threeAudio.panner.coneInnerAngle = 360;
      threeAudio.panner.coneOuterAngle = 360;

      // Position it at the mesh’s current world coordinates
      const pos = new THREE.Vector3();
      meshRef.current.children[0].getWorldPosition(pos);
      threeAudio.position.copy(pos);

      // Create a BufferSource and attach to PositionalAudio
      const sourceNode = audioCtx.createBufferSource();
      sourceNode.buffer = buffer;
      sourceNode.loop = false;
      sourceRef.current = sourceNode;
      threeAudio.setNodeSource(sourceNode);

      // Connect “dry” chain: the internal output of PositionalAudio → gain → analyser → masterTapGain → listener
      const dryOutput = threeAudio.getOutput();
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = volume;
      gainRef.current = gainNode;

      dryOutput.connect(gainNode);
      gainNode.connect(analyserNode);
      analyserNode.connect(masterTapGain);
      try {
        masterTapGain.connect(listener.getInput());
      } catch {
        // may already be connected
      }

      // Add the PositionalAudio object into the scene so Three.js can update it each frame
      scene.add(threeAudio);

      // Let parent know about the source so it can call .stop()/.start() if needed
      if (typeof onNodeReady === 'function') {
        onNodeReady(trackId, sourceNode);
      }

      // Start playback with offset
      sourceNode.start(audioCtx.currentTime + startDelay, offset);
    } else {
      // ─── UNASSIGNED: use a raw StereoPannerNode ───────────────────────────────
      const sourceNode = audioCtx.createBufferSource();
      sourceNode.buffer = buffer;
      sourceNode.loop = false;
      stereoSourceRef.current = sourceNode;

      const stereoPanner = audioCtx.createStereoPanner();
      stereoPanner.pan.value = pan; // initial pan −1…+1
      stereoPannerRef.current = stereoPanner;

      // Connect: source → stereoPanner → gain → analyser → masterTapGain → listener
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = volume;
      gainRef.current = gainNode;

      sourceNode.connect(stereoPanner);
      stereoPanner.connect(gainNode);
      gainNode.connect(analyserNode);
      analyserNode.connect(masterTapGain);
      try {
        masterTapGain.connect(listener.getInput());
      } catch {}

      // Let parent know about the source
      if (typeof onNodeReady === 'function') {
        onNodeReady(trackId, sourceNode);
      }

      sourceNode.start(audioCtx.currentTime + startDelay, offset);
    }

    // ─── SEND PATH (reverb): source → sendGain → convolver ─────────────────
    // Both assigned/unassigned use the same send chain
    const sendGainNode = audioCtx.createGain();
    sendGainNode.gain.setValueAtTime(sendLevel, audioCtx.currentTime);
    sendGainRef.current = sendGainNode;

    const sendSource = audioCtx.createBufferSource();
    sendSource.buffer = buffer;
    sendSource.loop = false;
    sendSource.connect(sendGainNode).connect(convolver);
    sendSource.start(audioCtx.currentTime + startDelay, offset);

    // No need to call onNodeReady again for the sendSource

    return () => {
      // Cleanup when effect re-runs or component unmounts

      // 1) Stop & remove PositionalAudio if used
      if (threeAudioRef.current) {
        try {
          threeAudioRef.current.stop?.();
        } catch {}
        try {
          threeAudioRef.current.disconnect();
        } catch {}
        try {
          scene.remove(threeAudioRef.current);
        } catch {}
      }

      // 2) Stop & disconnect the BufferSource(s)
      if (sourceRef.current) {
        try {
          sourceRef.current.stop();
        } catch {}
        try {
          sourceRef.current.disconnect();
        } catch {}
      }
      if (stereoSourceRef.current) {
        try {
          stereoSourceRef.current.stop();
        } catch {}
        try {
          stereoSourceRef.current.disconnect();
        } catch {}
      }

      // 3) Disconnect gain & sendGain
      if (gainRef.current) {
        try {
          gainRef.current.disconnect();
        } catch {}
      }
      if (sendGainRef.current) {
        try {
          sendGainRef.current.disconnect();
        } catch {}
      }

      // 4) Disconnect panner if stereo
      if (stereoPannerRef.current) {
        try {
          stereoPannerRef.current.disconnect();
        } catch {}
      }

      // 5) Disconnect analyser and masterTapGain
      try {
        analyserNode.disconnect();
      } catch {}
      try {
        masterTapGain.disconnect(listener.getInput());
      } catch {}

      // Clear all refs
      threeAudioRef.current = null;
      sourceRef.current = null;
      stereoSourceRef.current = null;
      // pannerRef.current = null;
      gainRef.current = null;
      sendGainRef.current = null;
      stereoPannerRef.current = null;
    };
  }, [
    on,
    paused,
    buffer,
    listener,
    convolver,
    playStartTime,
    pauseTime,
    dist,
    masterTapGain,
    meshRef,
    // pan,         // watch pan so stereo updates
    trackId,
  ]);

  // If this is the main track, fire onMainEnded when done:
  useEffect(() => {
    const offset = Number.isFinite(pauseTime) ? pauseTime : playStartTime || 0;
    if (isMain && buffer) {
      const remaining = buffer.duration - offset;
      const timeoutId = setTimeout(() => {
        if (on && !paused) {
          onMainEnded?.();
        }
      }, remaining * 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [isMain, buffer, on, paused, playStartTime, pauseTime, onMainEnded]);

  // Update dry volume in real time
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.linearRampToValueAtTime(volume, audioCtx.currentTime, 0.01);
    }
    onVolumeChange?.(trackId, volume);
  }, [volume, onVolumeChange, trackId, audioCtx]);

  // Update send level in real time
  useEffect(() => {
    if (sendGainRef.current) {
      sendGainRef.current.gain.linearRampToValueAtTime(sendLevel, audioCtx.currentTime, 0.01);
    }
    onSendLevelChange?.(trackId, sendLevel);
  }, [sendLevel, onSendLevelChange, trackId, audioCtx]);

  // Every frame:
  useFrame(() => {
    // 1) Analyser:
    if (analyserNode) {
      analyserNode.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;
      const level = Math.min(1, Math.max(0, (avg / 255) * volume));
      onAnalysedLevel?.(level);
    }

    // 2) If assigned (using PositionalAudio), advance its position automatically
    if (meshRef?.current?.children?.[0] && threeAudioRef.current) {
      const pos = new THREE.Vector3();
      meshRef.current.children[0].getWorldPosition(pos);
      threeAudioRef.current.position.copy(pos);
    }

    // 3) If unassigned, update StereoPanner’s pan smoothly
    if (!meshRef?.current?.children?.[0] && stereoPannerRef.current) {
      const now = audioCtx.currentTime;
      stereoPannerRef.current.pan.cancelScheduledValues(now);
      stereoPannerRef.current.pan.linearRampToValueAtTime(pan, now + 0.02);
    }
  });

  return null;
}
