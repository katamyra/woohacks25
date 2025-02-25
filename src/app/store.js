//store for the detination infomation (amenities)
import { configureStore } from '@reduxjs/toolkit';
import destinationReducer from './features/destination/destinationSlice';

const store = configureStore({
  reducer: {
    destination: destinationReducer, 
  },
});

export default store;
