// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit'
import trackSettingsReducer from './trackSettingsSlice'
import viewModeReducer      from './viewModeSlice'

export const store = configureStore({
  reducer: {
    trackSettings: trackSettingsReducer,
     viewMode:      viewModeReducer,
  },
})
