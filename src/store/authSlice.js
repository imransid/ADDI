import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../services/api';

// Async thunks for authentication
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ identifier, password, loginType = 'phone' }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(identifier, password, loginType);
      if (response.success) {
        // Store token in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data;
      }
      return rejectWithValue('Login failed');
    } catch (error) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ name, phone, password, nid, passport = null, referralCode = null }, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(name, phone, password, nid, passport, referralCode);
      if (response.success) {
        // Store token in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data;
      }
      return rejectWithValue('Registration failed');
    } catch (error) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Clear localStorage first
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Call API logout (which also clears localStorage as backup)
      await authAPI.logout();
      
      return { success: true };
    } catch (error) {
      // Even if API call fails, clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return { success: true }; // Return success to ensure state is cleared
    }
  }
);

export const verifyIdentity = createAsyncThunk(
  'auth/verifyIdentity',
  async ({ idType, idNumber }, { rejectWithValue }) => {
    try {
      const response = await authAPI.verifyIdentity(idType, idNumber);
      if (response.success) {
        return response.data;
      }
      return rejectWithValue('Identity verification failed');
    } catch (error) {
      return rejectWithValue(error.message || 'Identity verification failed');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ userId, newPassword }, { rejectWithValue }) => {
    try {
      const response = await authAPI.resetPassword(userId, newPassword);
      if (response.success) {
        return response;
      }
      return rejectWithValue('Password reset failed');
    } catch (error) {
      return rejectWithValue(error.message || 'Password reset failed');
    }
  }
);

// Get initial state from localStorage
const getInitialState = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  return {
    token: token || null,
    user: user || null,
    isAuthenticated: !!token,
    loading: false,
    error: null,
  };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    updateUserStatus: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        // Also update localStorage
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        // Ensure localStorage is cleared
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      })
      .addCase(logoutUser.rejected, (state) => {
        // Even on error, clear the state
        state.loading = false;
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        // Ensure localStorage is cleared
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      });

    // Verify Identity
    builder
      .addCase(verifyIdentity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyIdentity.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(verifyIdentity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Reset Password
    builder
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setCredentials, updateUserStatus } = authSlice.actions;
export default authSlice.reducer;
