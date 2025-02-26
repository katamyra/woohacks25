import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  destination: null,
};

const destinationsSlice = createSlice({
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

export const { setDestination, clearDestination } = destinationsSlice.actions;
export default destinationsSlice.reducer;
