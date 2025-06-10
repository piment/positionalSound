import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import Intro from './Intro.jsx';
import { AudioContextProvider } from './AudioContextProvider.jsx';
import { store } from './reducer/store.js';
import { Provider } from 'react-redux';
import { AudioBufferCacheProvider } from './AudioBufferCacheProvider.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AudioContextProvider>
      <Provider store={store}>
        <Intro>
          <App />
        </Intro>
      </Provider>
      <AudioBufferCacheProvider></AudioBufferCacheProvider>
    </AudioContextProvider>
  </React.StrictMode>
);
