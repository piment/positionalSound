// ImportMenu.jsx
import React, { useState } from 'react';

export default function ImportMenu({ groupNames, onAdd }) {
  // now an array of File objects
  const [files, setFiles] = useState([]);
  const [instrument, setInstrument] = useState('');
  const [isStereo, setIsStereo] = useState(false);
 const [sel, setSel] = useState(groupNames[0] || '');
  // handle selecting 1..N files
  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleAdd = () => {
    if (!sel || files.length === 0) return;

    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      // strip extension for a default track name
      const defaultName = file.name.replace(/\.[^/.]+$/, '');
      onAdd({
        file,
        url,
        name: defaultName,
        instrument,
        isStereo,
     groupName: sel
      });
    });

    // reset
    setFiles([]);
    setSel('');
    setIsStereo(false);
  };

  return (
    <div className="import-menu" style={{ marginBottom: '1em' }}>
      <input
        type="file"
        accept="audio/*"
        multiple                      // ← allow multi-select
        onChange={handleFileChange}
      />

      <select
        value={sel}
        onChange={(e) => setSel(e.target.value)}
        style={{ marginLeft: '0.5em' }}
      >
 {groupNames.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>

      <label style={{ marginLeft: '0.5em' }}>
        <input
          type="checkbox"
          checked={isStereo}
          onChange={(e) => setIsStereo(e.target.checked)}
        />{' '}
        Stereo
      </label>

      <button
        onClick={handleAdd}
        disabled={files.length === 0 || !sel}
        style={{ marginLeft: '0.5em' }}
      >
        Add {files.length} Track{files.length > 1 ? 's' : ''}
      </button>
    </div>
  );
}
