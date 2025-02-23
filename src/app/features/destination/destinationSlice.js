// src/features/destination/destinationSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  destination: null,
};

const destinationSlice = createSlice({
  name: 'destination',
  initialState,
  reducers: {
    setDestination: (state, action) => {
      state.destination = action.payload; 
    },
    clearDestination: (state) => {
      state.destination = null; 
    },
  },
});

export const { setDestination, clearDestination } = destinationSlice.actions;
export default destinationSlice.reducer;
