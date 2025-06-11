// HintTab.jsx
import React, { useState } from 'react';
import { FiInfo, FiX } from 'react-icons/fi';
import './css/HintTab.css';

export default function HintTab() {
  const [open, setOpen] = useState(false);

  return (
    <div className={`hint-tab${open ? ' open' : ''}`}>
      {' '}
      <button
        className='hint-toggle'
        onClick={() => setOpen((o) => !o)}
        aria-label='Show keyboard hints'
      >
        {open ? <FiX size={20} /> : <FiInfo size={20} />}
      </button>
      <div className='hint-panel'>
        <ul>
          <li id='play-pause'>
        <span className="hint-text">  Play/Pause</span>  <kbd>Spacebar</kbd>
          </li>
     
          <li id='move'>
            <span className="hint-text">Move</span>
           <div className='key-move'>
            <div> <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> </div>
             <span>or</span>
             <div> <kbd>←</kbd> <kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd> </div>
            </div>
          </li>   
            <li id='toggle-ui'>
          <span className="hint-text">  Toggle UI</span>  <kbd>U</kbd> 
          </li>
             <li id='toggle-perf'>
          <span className="hint-text">  Performance monitor</span>  <kbd> P</kbd> 
          </li>
          <li><span className="hint-text">Remove a mesh</span> Dbl click </li>
           <li><span className="hint-text">Rotate a mesh</span> Right click </li>
        </ul>
      </div>
    </div>
  );
}
