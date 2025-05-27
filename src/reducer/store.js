// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit'
import trackSettingsReducer from './trackSettingsSlice'

export const store = configureStore({
  reducer: {
    trackSettings: trackSettingsReducer,
  },
})
