import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import userReducer from './userSlice';
import walletReducer from './walletSlice';
import teamReducer from './teamSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    wallet: walletReducer,
    team: teamReducer,
  },
});

export default store;