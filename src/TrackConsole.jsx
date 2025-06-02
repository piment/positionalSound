import React from 'react';
import './TrackConsole.css'; // You'll create this for styling
import { useDispatch, useSelector } from 'react-redux';
import {
  addTrack,
  removeTrack,
  toggleVisibility,
  setColor,
  setVolume,
   setSendLevel,
} from './reducer/trackSettingsSlice';
export default function TrackConsole({
  trackList,
  settings,
  onClose,
  updateTrack
}) {


    const dispatch = useDispatch();

  return (
  <div className="track-console">
  {trackList.map(track => {
    const trackSettings = settings[track.id] || {};
    return (
      <div key={track.id} className="track-strip" style={{backgroundColor: `${trackSettings.color}c0`}}>
      
        <input
          className="track-slider"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={trackSettings.volume || 0}
          onChange={(e) =>
            updateTrack(track.id, { volume: parseFloat(e.target.value) })
          }
        />
        <input
          type="color"
          className="track-color"
          value={trackSettings.color || '#88ccff'}
        onChange={(e) =>
                          dispatch(
                            setColor({ trackId: track.id, color: e.target.value })
                          )
                        }
        />
        <input
          type="checkbox"
          checked={trackSettings.visible}
          className="track-visible"
          onChange={() => dispatch(toggleVisibility(track.id))}
        /> 
         <div className="track-name">{track.name}</div>
      </div>
    );
  })}
</div>

  );
}
