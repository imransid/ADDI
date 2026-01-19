import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAPI } from '../services/api';

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No authentication token');
      }
      const response = await userAPI.getUserProfile(token);
      if (response.success) {
        return response.data;
      }
      return rejectWithValue('Failed to fetch profile');
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (data, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No authentication token');
      }
      const response = await userAPI.updateProfile(token, data);
      if (response.success) {
        return response.data;
      }
      return rejectWithValue('Failed to update profile');
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update profile');
    }
  }
);

const initialState = {
  id: '368041',
  phone: '6017****4706',
  name: 'Guest User',
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateUser(state, action) {
      return { ...state, ...action.payload };
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.id = action.payload.id;
        state.phone = action.payload.phone;
        state.name = action.payload.name;
        state.isActive = action.payload.isActive !== undefined ? action.payload.isActive : false;
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        return { ...state, ...action.payload, error: null };
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { updateUser, clearError } = userSlice.actions;
export default userSlice.reducer;