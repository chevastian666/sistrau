import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import vehicleReducer from './slices/vehicleSlice';
import tripReducer from './slices/tripSlice';
import alertReducer from './slices/alertSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    vehicles: vehicleReducer,
    trips: tripReducer,
    alerts: alertReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;