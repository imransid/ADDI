import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { walletAPI } from '../services/api';

// Async thunks
export const fetchWallet = createAsyncThunk(
  'wallet/fetchWallet',
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No authentication token');
      }
      const response = await walletAPI.getWallet(token);
      if (response.success) {
        return response.data;
      }
      return rejectWithValue('Failed to fetch wallet');
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch wallet');
    }
  }
);

export const rechargeWallet = createAsyncThunk(
  'wallet/recharge',
  async (payload, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No authentication token');
      }
      // Handle both old format (just amount) and new format (object with amount and proofImageUrl)
      const amount = typeof payload === 'number' ? payload : payload.amount;
      const proofImageUrl = typeof payload === 'object' ? payload.proofImageUrl : '';
      const response = await walletAPI.recharge(token, amount, proofImageUrl);
      if (response.success) {
        return { 
          transactionId: response.data.transactionId,
          status: response.data.status,
          message: response.data.message 
        };
      }
      return rejectWithValue('Recharge failed');
    } catch (error) {
      return rejectWithValue(error.message || 'Recharge failed');
    }
  }
);

export const withdrawWallet = createAsyncThunk(
  'wallet/withdraw',
  async (payload, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No authentication token');
      }
      // Handle both old format (just amount) and new format (object with amount and payment details)
      const amount = typeof payload === 'number' ? payload : payload.amount;
      const paymentMethod = typeof payload === 'object' ? payload.paymentMethod : undefined;
      const paymentDetails = typeof payload === 'object' ? { name: payload.name, number: payload.number } : undefined;
      const vatTax = typeof payload === 'object' ? payload.vatTax : undefined;
      const netAmount = typeof payload === 'object' ? payload.netAmount : undefined;
      
      const response = await walletAPI.withdraw(token, amount, paymentMethod, paymentDetails, vatTax, netAmount);
      if (response.success) {
        return { amount, newBalance: response.data.newBalance };
      }
      return rejectWithValue('Withdrawal failed');
    } catch (error) {
      return rejectWithValue(error.message || 'Withdrawal failed');
    }
  }
);

const initialState = {
  rechargeWallet: 0,
  balanceWallet: 0,
  totalEarnings: 0,
  totalWithdrawals: 0,
  incomeToday: 0,
  incomeYesterday: 0,
  lossToday: 0,
  lossTotal: 0,
  loading: false,
  error: null,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setWallet(state, action) {
      return { ...state, ...action.payload };
    },
    updateBalance(state, action) {
      // action.payload: { amount }
      state.balanceWallet += action.payload.amount;
    },
    addEarnings(state, action) {
      const { amount } = action.payload;
      state.totalEarnings += amount;
      state.incomeToday += amount;
    },
    addWithdrawal(state, action) {
      const { amount } = action.payload;
      state.totalWithdrawals += amount;
      state.balanceWallet -= amount;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch wallet
    builder
      .addCase(fetchWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWallet.fulfilled, (state, action) => {
        state.loading = false;
        console.log('Wallet slice - received payload:', action.payload);
        // Update state with payload values
        if (action.payload) {
          state.rechargeWallet = action.payload.rechargeWallet ?? 0;
          state.balanceWallet = action.payload.balanceWallet ?? 0;
          state.totalEarnings = action.payload.totalEarnings ?? 0;
          state.totalWithdrawals = action.payload.totalWithdrawals ?? 0;
          state.incomeToday = action.payload.incomeToday ?? 0;
          state.incomeYesterday = action.payload.incomeYesterday ?? 0;
          state.lossToday = action.payload.lossToday ?? 0;
          state.lossTotal = action.payload.lossTotal ?? 0;
        }
        state.error = null;
      })
      .addCase(fetchWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Recharge
    builder
      .addCase(rechargeWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rechargeWallet.fulfilled, (state, action) => {
        state.loading = false;
        // Don't update balance immediately - wait for admin approval
        state.error = null;
      })
      .addCase(rechargeWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Withdraw
    builder
      .addCase(withdrawWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(withdrawWallet.fulfilled, (state, action) => {
        state.loading = false;
        state.totalWithdrawals += action.payload.amount;
        state.balanceWallet = action.payload.newBalance;
        state.error = null;
      })
      .addCase(withdrawWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setWallet, updateBalance, addEarnings, addWithdrawal, clearError } = walletSlice.actions;
export default walletSlice.reducer;