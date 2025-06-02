// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit'
import trackSettingsReducer from './trackSettingsSlice'
import viewModeReducer      from './viewModeSlice'
import positionsReducer from './positionsSlice';
export const store = configureStore({
  reducer: {
      positions: positionsReducer,
    trackSettings: trackSettingsReducer,
     viewMode:      viewModeReducer,
  },
})
