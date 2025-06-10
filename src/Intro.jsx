// Intro.jsx
import React, { Suspense, cloneElement, useEffect, useState } from 'react'
import { useGLTF, useTexture, useProgress } from '@react-three/drei'
import './css/Intro.css'
// 1) List everything you need to preload
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
  // …any other glb paths…
]

const TEXTURES = [
  '/amps/textures/Comb_Comb_BaseColor.png',
  '/amps/textures/Comb_Comb_Normal.png',
  '/amps/textures/Comb_Comb_Roughness.png',
  '/amps/textures/Comb_Comb_Metallic.png',
  '/drumkit/textures/cym_EmissiveMap.png',
  '/drumkit/textures/cym_normals.png',
  // …any other texture paths…
]

export default function Intro({ children }) {
  const [clicked, setClicked] = useState(false)
  const [preloaded, setPreloaded] = useState(false)

  // 2) Kick off preloading immediately
  useEffect(() => {
    MODELS.forEach((m) => useGLTF.preload(m))
    useTexture.preload(TEXTURES)
  }, [])

  // 3) Track progress
  const { loaded, total } = useProgress()
  // Once everything is fetched, mark preloaded = true
  useEffect(() => {
    if (total > 0 && loaded >= total) {
      setPreloaded(true)
    }
  }, [loaded, total])

  // 4) While not clicked _or_ not preloaded, show the overlay
  if (!clicked || !preloaded) {
    return (
      <div className="fullscreen">
<div className="main-titles">

        <h1> MusicRoom</h1>
          <h3>Virtual 3D music space by BarrenXY</h3>
</div>
        <div className="message-box">
          { !preloaded
            ? `Loading… (${loaded}/${total})`
            : <button onClick={() => setClicked(true)}>
                Click to Continue
              </button>
          }
        </div>
      </div>
    )
  }

  // 5) Everything’s ready and user clicked, render your app
  //    Pass a `ready` flag so children know they never need to suspense
  return React.cloneElement(children, { ready: true })
}