import React, { useState, useEffect } from 'react';

/**
 * ImportMenu
 * Props:
 *  - onAdd: (items: Array<{ file: File, url: string, name: string }>) => void
 *  - disabled: boolean (optional)
 */
export default function ImportMenu({ onAdd, disabled = false }) {
  const [files, setFiles] = useState([]);

  // Reset file input after add
  const fileInputRef = React.useRef();

  function handleFileChange(e) {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
  }

  function handleAdd() {
    if (!files.length) return;
    const items = files.map((file) => {
      const url = URL.createObjectURL(file);
      const name = file.name.replace(/\.[^/.]+$/, '');
      return { file, url, name };
    });
    onAdd(items);
    setFiles([]);
    // clear input element
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  }

  return (
    <div className="import-menu" style={{ margin: '1em 0' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        disabled={disabled}
        onChange={handleFileChange}
      />
      <button
        onClick={handleAdd}
        disabled={disabled || files.length === 0}
        style={{ marginLeft: '0.5em' }}
      >
        Add {files.length} Track{files.length > 1 ? 's' : ''}
      </button>
    </div>
  );
}
