import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import Intro from './Intro.jsx'
import { AudioContextProvider } from './AudioContextProvider.jsx'
import { store } from './reducer/store.js'
import { Provider } from 'react-redux'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
  <Intro>
  <AudioContextProvider>

  <Provider store={store}>
    <App />
  </Provider>
  </AudioContextProvider>
  </Intro>
  </React.StrictMode>,
)
