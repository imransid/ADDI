import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { teamAPI } from '../services/api';

// Async thunks
export const fetchTeam = createAsyncThunk(
  'team/fetchTeam',
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No authentication token');
      }
      const response = await teamAPI.getTeam(token);
      if (response.success) {
        return response.data;
      }
      return rejectWithValue('Failed to fetch team data');
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch team data');
    }
  }
);

// Initial state - all data will be fetched from database
const initialState = {
  userId: null,
  cumulativeRecharge: 0,
  tiers: {
    B: {
      percentage: 11,
      members: [],
    },
    C: {
      percentage: 4,
      members: [],
    },
    D: {
      percentage: 2,
      members: [],
    },
  },
  statistics: {
    todayNewMembers: 0,
    yesterdayNewMembers: 0,
    todayRechargeAmount: 0,
    yesterdayRechargeAmount: 0,
    currentMonthRechargeAmount: 0,
    lastMonthRechargeAmount: 0,
  },
  validMembers: [],
  invalidMembers: [],
  loading: false,
  error: null,
};

const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {
    setTeam(state, action) {
      return { ...state, ...action.payload };
    },
    addMember(state, action) {
      const { tier, member } = action.payload;
      state.tiers[tier].members.push(member);
      state.validMembers.push(member);
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch team
    builder
      .addCase(fetchTeam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeam.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Merge payload data into state
        if (action.payload) {
          state.userId = action.payload.userId || state.userId;
          state.cumulativeRecharge = action.payload.cumulativeRecharge ?? 0;
          state.tiers = action.payload.tiers || state.tiers;
          state.statistics = action.payload.statistics || state.statistics;
          state.validMembers = action.payload.validMembers || [];
          state.invalidMembers = action.payload.invalidMembers || [];
        }
      })
      .addCase(fetchTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setTeam, addMember, clearError } = teamSlice.actions;
export default teamSlice.reducer;