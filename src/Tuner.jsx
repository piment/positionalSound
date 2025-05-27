// Tuner.jsx
import React, { useEffect, useState } from 'react'

// Array of note names in an octave
const NOTE_NAMES = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B']

// Autocorrelation pitch detector (from Chris Wilson’s tuner example)
function autoCorrelate(buf, sampleRate) {
  const SIZE = buf.length
  let rms = 0
  for (let i = 0; i < SIZE; i++) {
    const val = buf[i]
    rms += val * val
  }
  if (rms < 0.000001) return -1  // too quiet

  let r1 = 0, r2 = SIZE - 1
  for (let i = 0; i < SIZE/2; i++) {
    if (Math.abs(buf[i]) < 0.2) { r1 = i; break }
  }
  for (let i = 1; i < SIZE/2; i++) {
    if (Math.abs(buf[SIZE-i]) < 0.2) { r2 = SIZE-i; break }
  }

  const trimmed = buf.slice(r1, r2)
  const newSize = trimmed.length
  const c = new Float32Array(newSize).fill(0)
  for (let i = 0; i < newSize; i++) {
    for (let j = 0; j < newSize - i; j++) {
      c[i] += trimmed[j] * trimmed[j+i]
    }
  }
  let d = 0
  while (c[d] > c[d+1]) d++
  let maxVal = -1, maxPos = -1
  for (let i = d; i < newSize; i++) {
    if (c[i] > maxVal) {
      maxVal = c[i]
      maxPos = i
    }
  }
  const T0 = maxPos
  // parabolic interpolation for finer resolution
  const x1 = c[T0-1], x2 = c[T0], x3 = c[T0+1]
  const a = (x1 + x3 - 2*x2) / 2
  const b = (x3 - x1) / 2
  const shift = a ? b / (2*a) : 0
  return sampleRate / (T0 + shift)
}

// Convert frequency to nearest note name
function freqToNoteName(freq) {
  if (freq < 0) return '—'
  // MIDI note number
  const noteNum = 12 * (Math.log2(freq / 440)) + 69
  const rounded = Math.round(noteNum)
  const octave  = Math.floor(rounded / 12) - 1
  const name    = NOTE_NAMES[((rounded % 12) + 12) % 12]
  return `${name}${octave}`
}

export default function Tuner({ analyser }) {
  const [note, setNote] = useState('—')

  useEffect(() => {
    if (!analyser) return
    const buf = new Float32Array(analyser.fftSize)

    let raf = null
    function update() {
      analyser.getFloatTimeDomainData(buf)
      const freq = autoCorrelate(buf, analyser.context.sampleRate)
      const newNote = freq > 0 ? freqToNoteName(freq) : '—'
      setNote(newNote)
      raf = requestAnimationFrame(update)
    }
    update()
    return () => cancelAnimationFrame(raf)
  }, [analyser])

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        padding: '8px 12px',
        background: 'rgba(0,0,0,0.6)',
        color: '#0f0',
        fontFamily: 'monospace',
        fontSize: '1.2em',
        borderRadius: 4,
        pointerEvents: 'none',
      }}
    >
      🎸 Tuner: {note}
    </div>
  )
}
