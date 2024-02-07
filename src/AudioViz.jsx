import { Box, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import React, { useState, useEffect, useRef } from 'react';

function AudioVisualizer() {
  const [audioCtx, setAudioCtx] = useState(null);
  const [audioElement, setAudioElement] = useState(null);
  const [track, setTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [pan, setPan] = useState(0);

const audioRef = useRef()
const audioDataArrayRef = useRef()
const analyserRef = useRef()


  useEffect(() => {
    if (!audioCtx) {
      initializeAudioContext();
    }
  }, []);

  const initializeAudioContext = () => {
    const newAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    setAudioCtx(newAudioCtx);

  };

  const togglePlayback = () => {
    if (!audioCtx) {
      initializeAudioContext();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => {
        loadAudio();
      });
    } else {
      loadAudio();
    }
  };

  const loadAudio = () => {
    if (!track) {
      const audio = document.createElement('audio');
      audio.src = 'sound.mp3';
      audio.crossOrigin = 'anonymous';
      // audio.addEventListener('ended', () => {
      //   setIsPlaying(false);
      // });

      const source = audioCtx.createMediaElementSource(audio);

      const gainNode = audioCtx.createGain();
      gainNode.gain.value = volume;

      const panner = audioCtx.createStereoPanner();
      panner.pan.value = pan;

analyserRef.current = new AnalyserNode(audioCtx)

const bufferLength = analyserRef.current.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);
analyserRef.current.getByteTimeDomainData(dataArray);
audio.loop = true
// Connect the source to be analysed
source.connect(analyserRef.current);

      source.connect(gainNode).connect(panner).connect(audioCtx.destination);

      setAudioElement(audio);
      setTrack(source);

      audio.play().then(() => {
        setIsPlaying(true);
      });
    } else {
      if (isPlaying) {
        audioElement.pause()
          setIsPlaying(false)
        
      } else {
        audioElement.play().then(() => {
          setIsPlaying(true);
        });
      }
    }
    drawVisualization()
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);

    if (track) {
      track.disconnect();
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = newVolume;

      const panner = audioCtx.createStereoPanner();
      panner.pan.value = pan;

      track.connect(gainNode).connect(panner).connect(audioCtx.destination);
    }
  };

  const handlePannerChange = (e) => {
    const newPan = parseFloat(e.target.value);
    setPan(newPan);

    if (track) {
      track.disconnect();
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = volume;

      const panner = audioCtx.createStereoPanner();
      panner.pan.value = newPan;

      track.connect(gainNode).connect(panner).connect(audioCtx.destination);
    }
  };

  const drawVisualization = () => {
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteTimeDomainData(dataArray);
    audioDataArrayRef.current = dataArray;

    if (audioRef.current && isPlaying) {
      requestAnimationFrame(drawVisualization);
    }
  };

  return (
    <div id="boombox">
      <div className="boombox-handle"></div>

      <div className="boombox-body">
        <section className="master-controls">
          <input
            type="range"
            min="0"
            max="2"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
          />
          <label htmlFor="volume">VOL</label>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={pan}
            onChange={handlePannerChange}
          />
          <label htmlFor="panner">PAN</label>
        </section>

        <section className="tape">
          <button
            data-playing={isPlaying ? 'true' : 'false'}
            className="tape-controls-play"
            role="switch"
            aria-checked={isPlaying ? 'true' : 'false'}
            onClick={togglePlayback}
          >
            <span>Play/Pause</span>
          </button>
        </section>
        <div className='audiocanvas'>
        <Canvas camera={{ position: [0, 0, 5] }}>
          <OrbitControls />
          <Visualizer3D audioDataArray={audioDataArrayRef} audioRef={audioRef} isPlaying={isPlaying} />
        </Canvas>
      </div>
      </div>
    </div>
  );
}


const Visualizer3D = ({ audioDataArray, audioRef, isPlaying }) => {
  useFrame(() => {
    const dataArray = audioDataArray.current;

    if (audioRef.current && isPlaying) {
      audioRef.current.scale.x = 1 + dataArray[0] / 256;
      audioRef.current.scale.y = 1 + dataArray[0] / 256;
      audioRef.current.scale.z = 1 + dataArray[0] / 256;
      audioRef.current.position.y = -1 + dataArray[0] / 256;
    }
  });
  return (
<>
    <ambientLight />
    <pointLight position={[10, 10, 10]} />
    <Box ref={audioRef} args={[1, 1, 1]} position={[0, 0, 0]} visible={true} />
  
</>
    )
  // return null;
};



export default AudioVisualizer;
