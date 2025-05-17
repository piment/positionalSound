// MultitrackDisplay.jsx
import React from 'react';
import Waveform from './Waveform';

/**
 * MultitrackDisplay
 * @param {Object} props
 * @param {Array<{ id?: string, name: string, file: File }>} props.tracks
 * @param {number} [props.width=400]
 * @param {number} [props.height=60]
 */
export default function MultitrackDisplay({ tracks, width = 400, height = 10 }) {
  if (!tracks || tracks.length === 0) return null;

  return (
    <div
      className="multitrack-display"
      style={{
        maxHeight: '200px',
        overflowY: 'auto',
        border: '1px solid #ccc',
        padding: '0.05em',
        marginBottom: '.1em',
      }}
    >
      {tracks.map((track, idx) => (
        <div
          key={track.id || `${track.name}-${idx}`}
          className="track-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '0.05em',
            height: '30px',
            // border: 'red solid 2px'
          }}
        >
          <div
            className="track-label"
            style={{
              width: '100px',
              fontSize: '0.9em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginRight: '0.5em',
            }}
          >
            {track.name}
          </div>
          <Waveform file={track.file} width={width} height={height} />
        </div>
      ))}
    </div>
  );
}
