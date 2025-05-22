import React from 'react';
import Waveform from './Waveform';

/**
 * MultitrackDisplay
 * @param {Object} props
 * @param {Array<{ id?: string, name: string, file: File }>} props.tracks
 * @param {number} [props.width=400]
 * @param {number} [props.height=60]
 * @param {(trackIndex: number) => void} props.onDelete called when deleting a track
 * @param {(trackIndex: number, newGroup: string) => void} props.onReassign called when reassigning a track
 * @param {string[]} props.groupNames list of available groups for reassignment
 */
export default function MultitrackDisplay({
  tracks,
  width = 400,
  height = 10,
  onDelete,
  onReassign,
  groupNames = [],
}) {
  if (!tracks || tracks.length === 0) return null;

  return (
    <div
      className="multitrack-display"
      style={{
        maxHeight: '200px',
        overflowY: 'auto',
        border: '1px solid #ccc',
        padding: '0.5em',
        marginBottom: '1em',
      }}
    >
      {tracks.map((track, idx) => (
        <div
          key={track.id || `${track.name}-${idx}`}
          className="track-row"
          style={{
            // height: '40px',
            display: 'flex',
            // alignItems: 'center',
            // marginBottom: '0.5em',
          }}
        >
          {/* Track label */}
          <div
            className="track-label"
            style={{
              width: '120px',
              fontSize: '0.9em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginRight: '0.5em',
            }}
          >
            {track.name}
          </div>

          {/* Reassign dropdown */}
          {onReassign && (
            <select
              value={track.name}
              onChange={(e) => onReassign(idx, e.target.value)}
              style={{ marginRight: '0.5em' }}
            >
              {groupNames.map((gName) => (
                <option key={gName} value={gName}>
                  {gName}
                </option>
              ))}
            </select>
          )}

          {/* Delete button */}
          {onDelete && (
            <button
              onClick={() => onDelete(idx)}
              style={{ marginRight: '0.5em' }}
            >
              ✖
            </button>
          )}

          {/* Waveform preview */}
          <div style={{ flexGrow: 1 , display: 'flex', alignItems:'center'}}>
            <Waveform file={track.file} width={width} height={height} />
          </div>
        </div>
      ))}
    </div>
  );
}
