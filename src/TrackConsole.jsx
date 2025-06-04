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
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';





export function SortableTrackRow({
  track,
  settings,
  updateTrack,
  removeTrack,
  meshes,
  assignments,
  toggleAssign,
}) {
  const dispatch = useDispatch();
  const [fxVisible, setFxVisible] = useState(null);
  const [assignVisible, setAssignVisible] = useState(null);

  // useSortable gives us transform/transition and drag‐handle props
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // opacity: isDragging ? 1 : .7,
  };

  // Find current assignment
  const getAssignment = (trackId) => {
    for (const [meshId, arr] of Object.entries(assignments)) {
      if (arr.some((t) => t.id === trackId)) return meshId;
    }
    return null;
  };

  const trackSettings = settings[track.id] || {};
  const isFxOpen = fxVisible === track.id;
  

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`track-strip ${isDragging ? 'dragging' : ''}`}
    >
      {/* ------ DRAG HANDLE PLACED AT TOP ------ */}
   

      {/* ------ REST OF THE ROW CONTENT ------ */}
      <div
        className="track-strip-inner"
        style={{ backgroundColor: `${trackSettings.color || '#88ccff'}c0` }}
      >   <div
        className="drag-handle"
        {...attributes}
        {...listeners}
        style={{ cursor: 'grab', padding: '4px', textAlign: 'center' }}
      >
        ☰
      </div>
        <div className="slider-buttons">
          <Slider
            orientation="vertical"
            min={0}
            max={1}
            step={0.01}
            value={trackSettings.volume || 0}
 onChange={(e, value) => {

              // value is already a number
              dispatch(setVolume({ trackId: track.id, volume: value }));
            }}

            className="track-slider"
          />
          <div className="buttons">
            <button onClick={() => removeTrack(track.id)} id="delete">
              🗑
            </button>
            <button onClick={() => setFxVisible(track.id)}>FX</button>
            {isFxOpen && (
              <div
                className="fx-panel"
                onPointerLeave={() => setFxVisible(null)}
              >
                <Slider
                  orientation="vertical"
                  min={0}
                  max={1}
                  step={0.01}
                  value={trackSettings.sendLevel || 0}
                 onChange={(e, value) =>
  dispatch(setSendLevel({ trackId: track.id, sendLevel: value }))
}
                  style={{ height: 100 }}
                />
                <div style={{ fontSize: '0.7em', textAlign: 'center' }}>
                  Send
                </div>
              </div>
            )}

            <button onClick={() => setAssignVisible(track.id)}>
              <img
                src={MeshIcon}
                alt="mesh icon"
                className="mesh-icon"
                style={{ width: '1em', height: '1em' }}
              />
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
                    const newMeshId =
                      e.target.value === 'null' ? null : e.target.value;
                    toggleAssign(track, newMeshId);
                    setAssignVisible(null);
                  }}
                >
                  <option value="null">Unassigned</option>
                  {meshes.map((meshObj) => (
                    <option key={meshObj.id} value={meshObj.id}>
                      {meshObj.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

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
        {/* <input
          type="checkbox"
          checked={trackSettings.visible || false}
          className="track-visible"
          onChange={() =>
            dispatch(toggleVisibility(track.id))
          }
        /> */}
        <div className="track-name">{track.name}</div>
      </div>
    </div>
  );
}

export default function TrackConsole({
  className,
  trackList,
  settings,
  visibleMap,
  toggleVisibility,
  setColor,
  onAdd,
  onAutoAssign,
  removeTrack,
  meshes,
  assignments,
  toggleAssign,
  updateTrack,
  isReorderable,
  onReorder,
}) {
  const dispatch = useDispatch();
  const [fxVisible, setFxVisible] = useState(null);
  const [assignVisible, setAssignVisible] = useState(null);
  const containerRef = useRef();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder({ active, over });
    }
  }

  return (
    <div className={className} ref={containerRef}>
      {isReorderable ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={trackList.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {trackList.map((track, index) => (
              <SortableTrackRow
                key={track.id}
                track={track}
                settings={settings}
                updateTrack={updateTrack}
                removeTrack={removeTrack}
                meshes={meshes}
                assignments={assignments}
                toggleAssign={toggleAssign}
              />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        <div className="track-list-static">
          {trackList.map((track) => {
            const trackSettings = settings[track.id] || {};
          
            const isFxOpen = fxVisible === track.id;
            return (
              <div
                key={track.id}
                className="track-strip"
                style={{
                  backgroundColor: `${trackSettings.color || '#88ccff'}c0`,
                }}
              >
                <div className="slider-buttons">
                  <Slider
                    orientation="vertical"
                    min={0}
                    max={1}
                    step={0.01}
                    value={trackSettings.volume || 0}
                    onChange={(e) =>
                      updateTrack(track.id, {
                        volume: parseFloat(e.target.value),
                      })
                    }
                    className="track-slider"
                  />
                  <div className="buttons">
                    <button onClick={() => removeTrack(track.id)} id="delete">
                      🗑
                    </button>
                    <button onClick={() => setFxVisible(track.id)}>FX</button>{' '}
                    {isFxOpen && (
                      <div
                        className="fx-panel"
                        onPointerLeave={() => setFxVisible(null)}
                      >
                        <Slider
                          orientation="vertical"
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
                        <div
                          style={{ fontSize: '0.7em', textAlign: 'center' }}
                        >
                          Send
                        </div>
                      </div>
                    )}

                    <button onClick={() => setAssignVisible(track.id)}>
                      <img
                        src={MeshIcon}
                        alt="mesh icon"
                        className="mesh-icon"
                      />
                    </button>

                    {assignVisible === track.id && (
                      <div
                        className="assign-panel"
                        onPointerLeave={() => setAssignVisible(null)}
                        style={{ position: 'absolute', zIndex: 10 }}
                      >
                        <select
                          value={(() => {
                            for (const [meshId, arr] of Object.entries(
                              assignments
                            )) {
                              if (arr.some((t) => t.id === track.id)) return meshId;
                            }
                            return '';
                          })()}
                          onChange={(e) => {
                            const newMeshId =
                              e.target.value === 'null' ? null : e.target.value;
                            toggleAssign(track, newMeshId);
                            setAssignVisible(null);
                          }}
                        >
                          <option value="null">Unassigned</option>
                          {meshes.map((meshObj) => (
                            <option key={meshObj.id} value={meshObj.id}>
                              {meshObj.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

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
                  checked={trackSettings.visible || false}
                  className="track-visible"
                  onChange={() =>
                    dispatch(toggleVisibility(track.id))
                  }
                />
                <div className="track-name">{track.name}</div>
              </div>
            );
          })}
        </div>
      )}

      {trackList.length === 0 && <div>No track yet</div>}

      <div className="import">
        <ImportMenu onAdd={onAdd} onAutoAssign={onAutoAssign} />
      </div>
    </div>
  );
}