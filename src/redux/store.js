import { configureStore } from '@reduxjs/toolkit';
import routesReducer from './routesSlice';
import destinationsReducer from './destinationsSlice';

export const store = configureStore({
  reducer: {
    routes: routesReducer,
    destination: destinationsReducer,
  },
});
