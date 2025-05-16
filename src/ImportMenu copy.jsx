// ImportMenu.jsx
import React, { useState } from 'react';

export default function ImportMenuCopy({ onAdd }) {
  // now an array of File objects
  const [files, setFiles] = useState([]);
  const [instrument, setInstrument] = useState('');
  const [isStereo, setIsStereo] = useState(false);

  // handle selecting 1..N files
  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleAdd = () => {
    if (!instrument || files.length === 0) return;

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
      });
    });

    // reset
    setFiles([]);
    setInstrument('');
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
        value={instrument}
        onChange={(e) => setInstrument(e.target.value)}
        style={{ marginLeft: '0.5em' }}
      >
        <option value="">Instrument Style…</option>
        <option value="drums">Drums</option>
        <option value="bass">Bass</option>
        <option value="guitar">Guitar</option>
        <option value="keys">Keys</option>
        <option value="vox">Vox</option>
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
        disabled={files.length === 0 || !instrument}
        style={{ marginLeft: '0.5em' }}
      >
        Add {files.length} Track{files.length > 1 ? 's' : ''}
      </button>
    </div>
  );
}
