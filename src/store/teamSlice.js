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

// Example team categories and members
const initialState = {
  cumulativeRecharge: 32453,
  tiers: {
    B: {
      percentage: 11,
      members: [
        { account: '60116****891', level: 'B', product: '--', tier: 'B' },
        { account: '60117****215', level: 'B', product: '--', tier: 'B' },
        { account: '60112****213', level: 'B', product: '--', tier: 'B' },
        { account: '60111****066', level: 'B', product: '--', tier: 'B' },
        { account: '60113****123', level: 'B', product: '--', tier: 'B' },
      ],
    },
    C: {
      percentage: 4,
      members: Array.from({ length: 14 }, (_, i) => ({
        account: `6011${i}****${String(i).padStart(3, '0')}`,
        level: 'C',
        product: '--',
        tier: 'C',
      })),
    },
    D: {
      percentage: 2,
      members: Array.from({ length: 10 }, (_, i) => ({
        account: `6012${i}****${String(i).padStart(3, '0')}`,
        level: 'D',
        product: '--',
        tier: 'D',
      })),
    },
  },
  statistics: {
    todayNewMembers: 0,
    yesterdayNewMembers: 0,
    todayRechargeAmount: 0,
    yesterdayRechargeAmount: 1163,
    currentMonthRechargeAmount: 14713,
    lastMonthRechargeAmount: 16740,
  },
  validMembers: [
    { account: '60116****891', level: 'B', product: '--', tier: 'B' },
    { account: '60117****215', level: 'B', product: '--', tier: 'B' },
    { account: '60112****213', level: 'B', product: '--', tier: 'B' },
    { account: '60111****066', level: 'B', product: '--', tier: 'B' },
  ],
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
        return { ...state, ...action.payload, error: null };
      })
      .addCase(fetchTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setTeam, addMember, clearError } = teamSlice.actions;
export default teamSlice.reducer;