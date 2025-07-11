
import React from 'react';
import './css/MeshSpawner.css'


export function MeshSpawner({ components, meshes, addMesh, className }) {

  return (
    <div className={className}>

    <div className="mesh-spawner-list">
      {Object.keys(components).map((part) => (
        <button
        key={part}
        onClick={() => addMesh(part)}
        style={{ display: 'block', margin: '4px 0' }}
        disabled={meshes.includes(part)}
        >
       {part}
        </button>
      ))}
      </div>
    </div>
  );
}
