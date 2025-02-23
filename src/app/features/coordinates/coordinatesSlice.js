import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  coordinates: [],
};

const coordinatesSlice = createSlice({
  name: 'coordinates',
  initialState,
  reducers: {
    addCoordinate: (state, action) => {
      state.coordinates.push(action.payload);
    },
    resetCoordinates: (state) => {
      state.coordinates = [];
    },
  },
});

export const { addCoordinate, resetCoordinates } = coordinatesSlice.actions;
export default coordinatesSlice.reducer;
