// DrumKitCanvas.jsx
import React, { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import {ObjSound} from './ObjControls'
import Sound from './Sound'

export default function DrumKitCanvas({
  meshes,
  assignments,
  playing,
  listener,
  convolver,
  addMesh,
  setAssignments,
  selectedPart,
  setSelectedPart,
}) {
  // now this is safely inside <Suspense>
  const { scene } = useGLTF('/drumkitpartedOPT.glb')

  return (
    <>
      {meshes.map((part) => {
        const group = scene.getObjectByName(part)
        if (!group) return null        // guard against typos
        const pos = new THREE.Vector3()
        group.getWorldPosition(pos)

        const subs = assignments[part] || []

        return (
          <ObjSound
            key={part}
            name={part}
            group={group}
            defPos={[pos.x, pos.y, pos.z]}
            subs={subs}
            on={playing}
            listener={listener}
            convolver={convolver}
            selected={selectedPart === part}
            onSelect={() => setSelectedPart(part)}
            onSubsChange={(newSubs) =>
              setAssignments((a) => ({ ...a, [part]: newSubs }))
            }
          />
        )
      })}

      {/* unassigned “dry” tracks */}
      {(assignments.null || []).map((sub) => (
        <Sound
          key={sub.id}
          name={sub.name}
          defPos={[0, 0, 0]}
          subs={[sub]}
          on={playing}
          listener={listener}
          convolver={convolver}
          selected={selectedPart === null}
          onSelect={() => setSelectedPart(null)}
          onSubsChange={(newSubs) =>
            setAssignments((a) => ({ ...a, null: newSubs }))
          }
        />
      ))}
    </>
  )
}
