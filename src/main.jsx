import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import Intro from './Intro.jsx'
import { AudioContextProvider } from './AudioContextProvider.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
  <Intro>
  <AudioContextProvider>

    <App />
  </AudioContextProvider>
  </Intro>
  </React.StrictMode>,
)
