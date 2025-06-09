// Sound.jsx
import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export default function Sound({
  buffer,
  on,
  paused,
  volume = 1,
  dist = 5,                 // PositionalAudio refDistance
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
  meshRef,
  pauseTime,
  onMainEnded,
  isMain = false,
  onNodeReady,
  pan = 0,                  // stereo pan for unassigned
}) {
  const { camera, scene } = useThree();
  const audioCtx = listener.context;

  // ────────────────────────────────────────────────────────────────────────────────
  // Refs for nodes we create
  // ────────────────────────────────────────────────────────────────────────────────
  const threeAudioRef    = useRef(null);    // THREE.PositionalAudio if assigned
  const positionalSrcRef = useRef(null);    // BufferSource for “assigned” path
  const stereoSrcRef     = useRef(null);    // BufferSource for “unassigned” path
  const stereoPannerRef  = useRef(null);    // StereoPannerNode for unassigned
  const gainRef          = useRef(null);    // GainNode that both branches share
  const sendGainRef      = useRef(null);    // GainNode for send/reverb
  const analyserRef      = useRef(null);    // AnalyserNode for visuals

  // Create exactly one AnalyserNode
  const analyserNode = useMemo(() => {
    const a = audioCtx.createAnalyser();
    a.fftSize = 4096;
    a.smoothingTimeConstant = 0.8;
    return a;
  }, [audioCtx]);

  // Uint8Array buffer for analyser data
  const dataArray = useMemo(
    () => new Uint8Array(analyserNode.frequencyBinCount),
    [analyserNode]
  );

  // Notify parent that analyser is ready
  useEffect(() => {
    analyserRef.current = analyserNode;

    if (typeof onAnalyserReady === 'function') {
      onAnalyserReady(trackId, analyserNode);
    }
  }, [analyserNode, onAnalyserReady, trackId]);

  // Attach the listener to the camera once
  useEffect(() => {
    camera.add(listener);
    return () => camera.remove(listener);
  }, [camera, listener]);

  // Helper: tear down absolutely everything we might have created
  const stopAndCleanupAll = () => {
    // (1) PositionalAudio + source
    if (threeAudioRef.current) {
      try { threeAudioRef.current.disconnect(); } catch {}
      try { scene.remove(threeAudioRef.current); } catch {}
      threeAudioRef.current = null;
    }
    if (positionalSrcRef.current) {
      try { positionalSrcRef.current.stop(); } catch {}
      try { positionalSrcRef.current.disconnect(); } catch {}
      positionalSrcRef.current = null;
    }

    // (2) Stereo source + panner
    if (stereoSrcRef.current) {
      try { stereoSrcRef.current.stop(); } catch {}
      try { stereoSrcRef.current.disconnect(); } catch {}
      stereoSrcRef.current = null;
    }
    if (stereoPannerRef.current) {
      try { stereoPannerRef.current.disconnect(); } catch {}
      stereoPannerRef.current = null;
    }

    // (3) GainNode
    if (gainRef.current) {
      try { gainRef.current.disconnect(); } catch {}
      gainRef.current = null;
    }

    // (4) SendGainNode
    if (sendGainRef.current) {
      try { sendGainRef.current.disconnect(); } catch {}
      sendGainRef.current = null;
    }

    // (5) Analyser
    if (analyserRef.current) {
      try { analyserRef.current.disconnect(); } catch {}
    }
  };

  // ────────────────────────────────────────────────────────────────────────────────
  // 1) SETUP EFFECT: create the source(s) + pan + gain + send + analyser
  //    Only re‐run when really necessary: on/pause/pauseTime/playStartTime/meshRef/buffer
  // ────────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Always tear down any old nodes first
    stopAndCleanupAll();

    // If we’re not supposed to be playing, or if data is missing, bail out
    if (!on || paused || !buffer || !listener) {
      return;
    }

    // Compute offset (seek) and a small start delay if starting fresh
    const offset = Number.isFinite(pauseTime) ? pauseTime : playStartTime || 0;
    const startDelay = pauseTime === 0 ? 0.01 : 0;

    // ── A) ASSIGNED PATH (when meshRef.current exists) ─────────────────────────
    if (meshRef?.current?.children?.[0]) {
      // 1) Create PositionalAudio
      const threeAudio = new THREE.PositionalAudio(listener);
      threeAudioRef.current = threeAudio;

      threeAudio.setRefDistance(dist);
      threeAudio.setRolloffFactor(0.05);
      threeAudio.panner.panningModel = 'equalpower';
      threeAudio.panner.distanceModel = 'inverse';
      threeAudio.panner.coneInnerAngle = 360;
      threeAudio.panner.coneOuterAngle = 360;

      // 2) Position it at the mesh’s current world coordinates
      const pos = new THREE.Vector3();
      meshRef.current.children[0].getWorldPosition(pos);
      threeAudio.position.copy(pos);

      // 3) Create a BufferSource → attach to PositionalAudio
      const posSource = audioCtx.createBufferSource();
      positionalSrcRef.current = posSource;
      posSource.buffer = buffer;
      posSource.loop = false;
      threeAudio.setNodeSource(posSource);
threeAudio.getOutput().disconnect();
      // 4) Create a shared GainNode for volume
      const gNode = audioCtx.createGain();
      gNode.gain.value = volume;
      gainRef.current = gNode;

      // 5) Wire: PositionalAudio.getOutput() → gain → analyser → masterTapGain → listener
      threeAudio.getOutput().connect(gNode);
      gNode.connect(analyserNode);
      analyserNode.connect(masterTapGain);
      try { masterTapGain.connect(listener.getInput()); } catch {}

      // 6) Put PositionalAudio into the scene so it auto‐updates
      scene.add(threeAudio);

      // 7) Inform parent of the source node
      if (typeof onNodeReady === 'function') {
        onNodeReady(trackId, posSource);
      }

      // 8) Start playback
      posSource.start(audioCtx.currentTime + startDelay, offset);

      // 9) “Send” (reverb) chain
      const sGain = audioCtx.createGain();
      sGain.gain.setValueAtTime(sendLevel, audioCtx.currentTime);
      sendGainRef.current = sGain;

      const sendSource = audioCtx.createBufferSource();
      sendSource.buffer = buffer;
      sendSource.loop = false;
      sendSource.connect(sGain).connect(convolver);
      sendSource.start(audioCtx.currentTime + startDelay, offset);

      // 10) Cleanup only assigned‐branch nodes
      return () => {
        if (threeAudioRef.current) {
          try { threeAudioRef.current.disconnect(); } catch {}
          try { scene.remove(threeAudioRef.current); } catch {}
        }
        if (positionalSrcRef.current) {
          try { positionalSrcRef.current.stop(); } catch {}
          try { positionalSrcRef.current.disconnect(); } catch {}
        }
        if (gainRef.current) {
          try { gainRef.current.disconnect(); } catch {}
        }
        if (sendGainRef.current) {
          try { sendGainRef.current.disconnect(); } catch {}
        }
        try { analyserNode.disconnect(); } catch {}
        try { masterTapGain.disconnect(listener.getInput()); } catch {}
      };
    }

    // ── B) UNASSIGNED PATH (no meshRef) ──────────────────────────────────────────
    // 1) Create BufferSource
    const stereoSource = audioCtx.createBufferSource();
    stereoSrcRef.current = stereoSource;
    stereoSource.buffer = buffer;
    stereoSource.loop = false;

    // 2) Create StereoPannerNode + set initial pan
    const spanner = audioCtx.createStereoPanner();
    stereoPannerRef.current = spanner;
    spanner.pan.value = pan;

    // 3) Create a shared GainNode for volume
    const gNode = audioCtx.createGain();
    gNode.gain.value = volume;
    gainRef.current = gNode;

    // 4) Wire: stereoSource → spanner → gain → analyser → masterTapGain → listener
    stereoSource.connect(spanner);
    spanner.connect(gNode);
    gNode.connect(analyserNode);
    analyserNode.connect(masterTapGain);
    try { masterTapGain.connect(listener.getInput()); } catch {}

    // 5) Inform parent of the source
    if (typeof onNodeReady === 'function') {
      onNodeReady(trackId, stereoSource);
    }

    // 6) Start playback
    stereoSource.start(audioCtx.currentTime + startDelay, offset);

    // 7) “Send” (reverb) chain
    const sGain = audioCtx.createGain();
    sGain.gain.setValueAtTime(sendLevel, audioCtx.currentTime);
    sendGainRef.current = sGain;

    const sendSource = audioCtx.createBufferSource();
    sendSource.buffer = buffer;
    sendSource.loop = false;
    sendSource.connect(sGain).connect(convolver);
    sendSource.start(audioCtx.currentTime + startDelay, offset);

    // 8) Cleanup only unassigned‐branch nodes
    return () => {
      if (stereoSrcRef.current) {
        try { stereoSrcRef.current.stop(); } catch {}
        try { stereoSrcRef.current.disconnect(); } catch {}
      }
      if (stereoPannerRef.current) {
        try { stereoPannerRef.current.disconnect(); } catch {}
      }
      if (gainRef.current) {
        try { gainRef.current.disconnect(); } catch {}
      }
      if (sendGainRef.current) {
        try { sendGainRef.current.disconnect(); } catch {}
      }
      try { analyserNode.disconnect(); } catch {}
      try { masterTapGain.disconnect(listener.getInput()); } catch {}
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
    meshRef,      // re-run if meshRef toggles assigned ↔ unassigned
    trackId,
  ]);

  // ────────────────────────────────────────────────────────────────────────────────
  // 2) UPDATE “volume” in real time (shared by either branch)
  // ────────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.linearRampToValueAtTime(volume, audioCtx.currentTime, 0.01);
    }
    if (typeof onVolumeChange === 'function') {
      onVolumeChange(trackId, volume);
    }
  }, [volume, onVolumeChange, trackId, audioCtx]);

  // ────────────────────────────────────────────────────────────────────────────────
  // 3) UPDATE “sendLevel” in real time (shared by either branch)
  // ────────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (sendGainRef.current) {
      sendGainRef.current.gain.linearRampToValueAtTime(sendLevel, audioCtx.currentTime, 0.01);
    }
    if (typeof onSendLevelChange === 'function') {
      onSendLevelChange(trackId, sendLevel);
    }
  }, [sendLevel, onSendLevelChange, trackId, audioCtx]);

  // ────────────────────────────────────────────────────────────────────────────────
  // 4) UPDATE “pan” in real time, but only when unassigned
  // ────────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!meshRef?.current?.children?.[0] && stereoPannerRef.current) {
      stereoPannerRef.current.pan.setValueAtTime(pan, audioCtx.currentTime);
    }
  }, [pan, audioCtx, meshRef]);

  // ────────────────────────────────────────────────────────────────────────────────
  // 5) If this is the “main” track, fire onMainEnded when it finishes
  // ────────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const offset = Number.isFinite(pauseTime) ? pauseTime : playStartTime || 0;
    if (isMain && buffer) {
      const remaining = buffer.duration - offset;
      const timeout = setTimeout(() => {
        if (on && !paused) onMainEnded?.();
      }, remaining * 1000);
      return () => clearTimeout(timeout);
    }
  }, [isMain, buffer, on, paused, playStartTime, pauseTime, onMainEnded]);

  // ────────────────────────────────────────────────────────────────────────────────
  // 6) Each frame: analyser + update positional location
  // ────────────────────────────────────────────────────────────────────────────────
  useFrame(() => {
    if (analyserNode) {
      analyserNode.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;
      const level = Math.min(1, Math.max(0, (avg / 255) * volume));
      onAnalysedLevel?.(level);
      // console.log(level)
    }

    // If assigned, update PositionalAudio’s position each frame
    if (meshRef?.current?.children?.[0] && threeAudioRef.current) {
      const pos = new THREE.Vector3();
      meshRef.current.children[0].getWorldPosition(pos);
      threeAudioRef.current.position.copy(pos);
    }
  });

  return null;
}
