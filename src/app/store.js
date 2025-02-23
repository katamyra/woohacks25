// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import coordinatesReducer from './features/coordinates/coordinatesSlice';

const store = configureStore({
  reducer: {
    coordinates: coordinatesReducer,
  },
});

export default store;
