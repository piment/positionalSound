import { Suspense, cloneElement, useEffect, useState } from 'react'


function Ready({ setReady }) {
  useEffect(() => () => void setReady(true), [])
  return null
}

export default function Intro({ children }) {
  const [clicked, setClicked] = useState(false)
  const [ready, setReady] = useState(true)

  return (
    <>    
      <Suspense fallback={<Ready setReady={setReady} />}>
        {cloneElement(children, { ready: clicked && ready})}
      </Suspense>
      <div className={`fullscreen bg ${ready ? 'ready' : 'notready'} ${clicked && 'clicked'}`}>
  
        <div className="stack">
          <a href="#" onClick={() => setClicked(true)}>
            {!ready ? 'loading' : 'click to continue'}
          </a>
        </div>
   
      </div>
    </>
  )
}