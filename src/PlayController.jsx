// PlayController.jsx
import React, { useEffect, useState, useRef } from 'react';
import './css/PlayController.css';
import { RxPause, RxPlay, RxStop } from "react-icons/rx";
export default function PlayController({
  playAll,
  pauseAll,
  stopAll,
  clearSession,
  busLevel,
  setBusLevel,
  duration,       // total duration of “main” track, in seconds
  currentTime,    // current playback time of that track, in seconds
  playing,        // boolean flag: is playback underway?
}) {
  const [progress, setProgress] = useState(0); // 0 → 1

  // Update progress whenever currentTime or duration changes
  useEffect(() => {
    if (!duration || duration === 0) {
      setProgress(0);
      return;
    }
    const pct = Math.min(1, Math.max(0, currentTime / duration));
    setProgress(pct);
  }, [currentTime, duration]);

  return (  
    
   <div className="play-controller-container"> 
  
    <div className="reverb-row">
        <label htmlFor="bus-slider" className="reverb-label">
          Reverb Bus Level
        </label>
        <input
          id="bus-slider"
          type="range"
          min={0}
          max={2}
          step={0.01}
          value={busLevel}
          onChange={(e) => setBusLevel(parseFloat(e.target.value))}
          className="reverb-slider"
        />
      </div>
     
  

      <div className="player-main">

      <div className="button-row">
        <div className='play-btns'>

        <button onClick={playAll} className="ctrl-btn">
       <RxPlay />
        </button>
        <button onClick={pauseAll} className="ctrl-btn">
         <RxPause />
        </button>
        <button onClick={stopAll} className="ctrl-btn">
         <RxStop />
        </button>
        </div>
        <div className='clear-btn-wrap'>

        <button onClick={clearSession} className="ctrl-btn clear-btn">
          ✖️ Clear Session
        </button>
        </div>
      </div>

 

      <div className="progress-bar-container">
        <div className="time-label">{formatTime(currentTime)}</div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${(progress || 0) * 100}%` }}
            />
        </div>
        <div className="time-label">{formatTime(duration)}</div>
      </div>
    </div>
            </div> 
  );
}

// Helper to format seconds → MM:SS
function formatTime(sec) {
  if (!sec || isNaN(sec)) return '00:00';
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60);
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${mm}:${ss}`;
}
