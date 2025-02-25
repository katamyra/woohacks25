import { createSlice } from '@reduxjs/toolkit';

const routesSlice = createSlice({
  name: 'routes',
  initialState: {
    currentRoute: null
  },
  reducers: {
    setCurrentRoute: (state, action) => {
      state.currentRoute = action.payload;
    },
    clearRoute: (state) => {
      state.currentRoute = null;
    }
  }
});

export const { setCurrentRoute, clearRoute } = routesSlice.actions;
export default routesSlice.reducer; 