// index.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import App from './App.jsx'
import DemoScene from './DemoScene.jsx'    // your fixed‐setup demo
import Intro from './Intro.jsx'
import { AudioContextProvider } from './AudioContextProvider.jsx'
import { AudioBufferCacheProvider } from './AudioBufferCacheProvider.jsx'
import { store } from './reducer/store.js'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AudioContextProvider>
      <Provider store={store}>
        <AudioBufferCacheProvider>
          <BrowserRouter>
            <Routes>
              {/* Landing page */}
              <Route path="/" element={<Intro />}>
                {/* Nested routes under Intro */}
                <Route path="/visualizer" element={<App />} />
                <Route path="/demo"       element={<DemoScene />} />
                {/* Optional: default index route could just show buttons */}
    
              </Route>
              {/* Fallback for unknown URLs */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AudioBufferCacheProvider>
      </Provider>
    </AudioContextProvider>
  </React.StrictMode>
)
