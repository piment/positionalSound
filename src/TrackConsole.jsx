import React, { useEffect, useRef, useState } from 'react';
import './css/TrackConsole.css'; // You'll create this for styling
import { useDispatch, useSelector } from 'react-redux';
import {
  addTrack,
  removeTrack,
  toggleVisibility,
  setColor,
  setVolume,
  setSendLevel,
} from './reducer/trackSettingsSlice';
import ImportMenu from './ImportMenu';
import { div } from 'three/examples/jsm/nodes/Nodes.js';
import { Slider } from '@mui/material';
import MeshIcon from './assets/3d-modeling.png';

export default function TrackConsole({
  className,
  trackList,
  settings,
  onClose,
  updateTrack,
  onAdd,
  onAutoAssign,
  removeTrack,
  meshes,
  assignments,
  toggleAssign,
}) {
  const dispatch = useDispatch();
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [fxVisible, setFxVisible] = useState(null);
 const [assignVisible, setAssignVisible] = useState(null);

 const containerRef = useRef();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let scrollTarget = el.scrollLeft;
    let isScrolling = false;

    const smoothScroll = () => {
      if (!isScrolling) return;
      el.scrollLeft += (scrollTarget - el.scrollLeft) * 0.1;

      if (Math.abs(scrollTarget - el.scrollLeft) > 0.5) {
        requestAnimationFrame(smoothScroll);
      } else {
        isScrolling = false;
      }
    };

    const onWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        scrollTarget += e.deltaY;
        scrollTarget = Math.max(0, Math.min(scrollTarget, el.scrollWidth));
        if (!isScrolling) {
          isScrolling = true;
          requestAnimationFrame(smoothScroll);
        }
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, []);

  function getAssignment(trackId) {
      // if (!assignments) return null;
    for (const [mesh, tracks] of Object.entries(assignments)) {
      if (tracks.some((t) => t.id === trackId)) {
        return mesh;
      }
    }
    return null;
  }

  return (
    <div className={className} ref={containerRef}>
      
      {trackList.map((track) => {
        const trackSettings = settings[track.id] || {};
        const isFxOpen = fxVisible === track.id;
        return (
          <div
            key={track.id}
            className='track-strip'
            style={{ backgroundColor: `${trackSettings.color}c0` }}
          >
            <div className='slider-buttons'>
    
              <Slider
                orientation='vertical'
                min={0}
                max={1}
                step={0.01}
                value={trackSettings.volume || .8}
                onChange={(e) =>
                  updateTrack(track.id, { volume: parseFloat(e.target.value) })
                }
                // style={{ height: 150 }}
                className='track-slider'
              />
              <div className='buttons'>
                <button onClick={() => removeTrack(track.id)} id='delete'>
                  🗑
                </button>
                <button onClick={() => setFxVisible(track.id)}>FX</button>{' '}
                {isFxOpen && (
                  <div
                    className='fx-panel'
                    onPointerLeave={() => setFxVisible(null)}
                  >
                    <Slider
                      orientation='vertical'
                      min={0}
                      max={1}
                      step={0.01}
                      value={trackSettings.sendLevel || 0}
                      onChange={(e) =>
                        updateTrack(track.id, {
                          sendLevel: parseFloat(e.target.value),
                        })
                      }
                      style={{ height: 100 }}
                    />
                    <div style={{ fontSize: '0.7em', textAlign: 'center' }}>
                      Send
                    </div>
                  </div>
                )}
          <button onClick={() => setAssignVisible(track.id)}>
                    <img src={MeshIcon} alt='mesh icon' className='mesh-icon' />
                  </button>

              {assignVisible === track.id && (
  <div
    className="assign-panel"
    onPointerLeave={() => setAssignVisible(null)}
    style={{ position: 'absolute', zIndex: 10 }}
  >
    <select
      value={getAssignment(track.id) || ''}
      onChange={(e) => {
        toggleAssign(track, e.target.value === 'null' ? null : e.target.value);
        setAssignVisible(null); // close after selection
      }}
    >
      <option value="null">Unassigned</option>
      {meshes.map((mesh) => (
        <option key={mesh} value={mesh}>
          {mesh}
        </option>
      ))}
    </select>
  </div>
)}
                </div>
              </div>
   

            <input
              type='color'
              className='track-color'
              value={trackSettings.color || '#88ccff'}
              onChange={(e) =>
                dispatch(setColor({ trackId: track.id, color: e.target.value }))
              }
            />
            <input
              type='checkbox'
              checked={trackSettings.visible}
              className='track-visible'
              onChange={() => dispatch(toggleVisibility(track.id))}
            />
            <div className='track-name'>{track.name}</div>
          </div>
        );
      })}
      {trackList.length === 0 && <div>No track yet</div>}
      <div className='import'>
        <ImportMenu onAdd={onAdd} onAutoAssign={onAutoAssign} />
      </div>
    </div>
  );
}
