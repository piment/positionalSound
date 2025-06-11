// Intro.jsx
import React, { useState, useEffect } from 'react'
import { useGLTF, useTexture, useProgress } from '@react-three/drei'
import { Link, Outlet } from 'react-router-dom'
import './css/Intro.css'

const MODELS = [
  '/amps/bass_svt.glb',
  '/amps/guitar_amp.glb',
  '/drumkit/HihatMin.glb',
  '/drumkit/CrashMin.glb',
  '/drumkit/Kick.glb',
  '/drumkit/Overhead.glb',
  '/drumkit/RideMin.glb',
  '/drumkit/SnareMin.glb',
  '/drumkit/Tom2.glb',
  '/drumkit/Tom3.glb',
  '/drumkit/TomFloor.glb',
]
const TEXTURES = [
  '/amps/textures/Comb_Comb_BaseColor.png',
  '/amps/textures/Comb_Comb_Normal.png',
  '/amps/textures/Comb_Comb_Roughness.png',
  '/amps/textures/Comb_Comb_Metallic.png',
  '/drumkit/textures/cym_EmissiveMap.png',
  '/drumkit/textures/cym_normals.png',
]

export default function Intro() {
  const [clicked, setClicked]     = useState(false)
  const [preloaded, setPreloaded] = useState(false)
  const { loaded, total }         = useProgress()

  // kick off all preloads once
  useEffect(() => {
    MODELS.forEach(useGLTF.preload)
    useTexture.preload(TEXTURES)
  }, [])

  // mark ready when everything is fetched
  useEffect(() => {
    if (total > 0 && loaded >= total) setPreloaded(true)
  }, [loaded, total])

  // still loading or user hasn’t clicked → show splash
  if (!preloaded || !clicked) {
    return (
      <div className="fullscreen bg">
        <div className="main-titles">
          <h1>MusicRoom</h1>
          <h3>Virtual 3D music space by BarrenXY</h3>
        </div>
        <div className="message-box">
          {!preloaded ? (
            <>Loading… ({loaded}/{total})</>
          ) : (
            <div className="landing-buttons">
              <Link to="visualizer">
                <button onClick={() => setClicked(true)}>Try it now!</button>
              </Link>
              <Link to="demo">
                <button onClick={() => setClicked(true)}>🚀 Demo</button>
              </Link> 
            </div>
          )}
        </div>
      </div>
    )
  }

  // once they’ve clicked and we’re ready, render the chosen route
  return <Outlet />
}
