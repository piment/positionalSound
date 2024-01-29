import { useLoader, useThree } from "@react-three/fiber"
import { useEffect, useRef, useState } from "react"
import * as THREE from 'three'





function Sound({ url, on,  paused, ...props }) {
  const sound = useRef()
  const { camera } = useThree()
  
  const buffer = useLoader(THREE.AudioLoader, url)

const [listener] = useState(() => new THREE.AudioListener())

useEffect(() => {
if(on){
    sound.current.play()
}
else if (!on){
  sound.current.pause()
}

if (paused) {
  sound.current.setVolume(0);
  // click(true)
} else if (!paused) {
  sound.current.setVolume(1);
  // click(false)
}
}, [on, paused])

  useEffect(() => {
    sound.current.setBuffer(buffer)
    sound.current.setRefDistance(3)
    sound.current.setLoop(true)

    camera.add(listener)
    return () => camera.remove(listener)
  }, [])
  return <positionalAudio ref={sound} args={[listener]} />
}


export default Sound