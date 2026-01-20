import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { logoutUser, updateUserStatus } from '../store/authSlice';
import { fetchUserProfile } from '../store/userSlice';
import { fetchWallet } from '../store/walletSlice';
import { fetchTeam } from '../store/teamSlice';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency } from '../utils/currency';
import { productAPI, vipAPI } from '../services/api';

/**
 * User (Me) page. Displays a summary of the user's wallets, earnings,
 * losses, and team commission tiers. Includes quick links to coupons,
 * funding details, and teams.
 */
const User = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const wallet = useSelector((state) => state.wallet);
  const team = useSelector((state) => state.team);
  const auth = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const { settings } = useSettings();
  
  // Account status from database
  const [accountStatus, setAccountStatus] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  
  // Check if user has purchased any product
  const [hasPurchasedProduct, setHasPurchasedProduct] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);
  
  // VIP status
  const [vipStatus, setVipStatus] = useState(null);
  const [loadingVIP, setLoadingVIP] = useState(false);
  const [claimingRewards, setClaimingRewards] = useState(false);

  // Fetch account status directly from database
  const fetchAccountStatus = useCallback(async () => {
    if (!auth.isAuthenticated || !auth.user?.id) {
      setLoadingStatus(false);
      return;
    }

    try {
      setLoadingStatus(true);
      const userDoc = await getDoc(doc(db, 'users', auth.user.id));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const isActive = userData.isActive !== undefined ? userData.isActive : false;
        
        
        // check
        setAccountStatus(isActive);
        
        // Also update auth state if it's different
        if (auth.user?.isActive !== isActive) {
          dispatch(updateUserStatus({ isActive }));
        }
      }
    } catch (error) {
      console.error('Error fetching account status:', error);
    } finally {
      setLoadingStatus(false);
    }
  }, [auth.isAuthenticated, auth.user?.id, auth.user?.isActive, dispatch]);

  // Check if user has purchased any product
  const checkUserPurchases = useCallback(async () => {
    if (!auth.isAuthenticated || !auth.user?.id) {
      return;
    }
    
    try {
      setCheckingPurchase(true);
      const response = await productAPI.getUserProducts(null);
      if (response.success) {
        const totalProducts = (response.data.unexpired?.length || 0) + (response.data.expired?.length || 0);
        setHasPurchasedProduct(totalProducts > 0);
      }
    } catch (error) {
      console.error('Failed to check user purchases:', error);
      setHasPurchasedProduct(false);
    } finally {
      setCheckingPurchase(false);
    }
  }, [auth.isAuthenticated, auth.user?.id]);

  // Fetch VIP status
  const fetchVIPStatus = useCallback(async () => {
    if (!auth.isAuthenticated || !auth.user?.id) {
      return;
    }

    try {
      setLoadingVIP(true);
      const response = await vipAPI.getVIPStatus(null);
      if (response.success) {
        setVipStatus(response.data);
        // Auto-check and claim rewards when viewing page
        try {
          await vipAPI.claimVIPRewards(null);
          // Refresh wallet after claiming rewards
          dispatch(fetchWallet());
        } catch (rewardError) {
          // Silently fail - rewards might already be claimed
        }
      }
    } catch (error) {
      console.error('Failed to fetch VIP status:', error);
    } finally {
      setLoadingVIP(false);
    }
  }, [auth.isAuthenticated, auth.user?.id, dispatch]);

  // Manually claim VIP rewards
  const handleClaimVIPRewards = async () => {
    if (!auth.isAuthenticated || !auth.user?.id) {
      return;
    }

    try {
      setClaimingRewards(true);
      const response = await vipAPI.claimVIPRewards(null);
      if (response.success) {
        const { weekly, monthly } = response.data;
        let message = '';
        if (weekly?.success) {
          message += `Weekly reward: ${formatCurrency(weekly.amount, settings.currency)}\n`;
        }
        if (monthly?.success) {
          message += `Monthly reward: ${formatCurrency(monthly.amount, settings.currency)}\n`;
        }
        if (message) {
          alert(message.trim() || 'Rewards claimed successfully!');
          // Refresh wallet and VIP status
          dispatch(fetchWallet());
          fetchVIPStatus();
        } else {
          alert('No rewards available at this time.');
        }
      }
    } catch (error) {
      alert('Failed to claim rewards: ' + error.message);
    } finally {
      setClaimingRewards(false);
    }
  };

  // Fetch data on component mount and when page becomes visible
  useEffect(() => {
    if (auth.isAuthenticated) {
      dispatch(fetchUserProfile());
      dispatch(fetchWallet()).then((result) => {
        if (result.error) {
          console.error('Wallet fetch error:', result.error);
        }
      });
      dispatch(fetchTeam());
      fetchAccountStatus();
      checkUserPurchases();
      fetchVIPStatus();
    }
  }, [auth.isAuthenticated, dispatch, fetchAccountStatus, checkUserPurchases, fetchVIPStatus]);

  // Debug: Log wallet state

  // Refresh wallet and account status when page becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && auth.isAuthenticated) {
        dispatch(fetchWallet());
        fetchAccountStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [auth.isAuthenticated, dispatch, fetchAccountStatus]);

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) {
      return;
    }
    
    try {
      await dispatch(logoutUser()).unwrap();
      // Force navigation to login and clear any cached state
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, redirect to login
      window.location.href = '/login';
    }
  };

  // Safely get wallet values with fallback to 0
  const getWalletValue = (value) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const cards = [
    { label: 'Recharge wallet (for purchases)', value: getWalletValue(wallet.rechargeWallet) },
    { label: 'Balance wallet', value: getWalletValue(wallet.balanceWallet) },
    { label: 'Total earnings', value: getWalletValue(wallet.totalEarnings) },
    { label: 'Total withdrawals', value: getWalletValue(wallet.totalWithdrawals) },
    { label: 'Income today', value: getWalletValue(wallet.incomeToday) },
    { label: "Yesterday's earnings", value: getWalletValue(wallet.incomeYesterday) },
    { label: "Today's loss", value: getWalletValue(wallet.lossToday) },
    { label: 'Total loss', value: getWalletValue(wallet.lossTotal) },
  ];

  const handleRefreshWallet = () => {
    dispatch(fetchWallet()).then((result) => {
      if (result.error) {
        alert('Failed to refresh wallet: ' + result.error);
      } else {
        alert('Wallet refreshed successfully');
      }
    });
  };

  // Calculate available earnings
  const availableEarnings = getWalletValue(wallet.totalEarnings) - getWalletValue(wallet.totalWithdrawals);
  
  // Calculate net profit (earnings - losses)
  const netProfit = getWalletValue(wallet.totalEarnings) - getWalletValue(wallet.lossTotal);


  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-50 pb-20">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-10 px-4 shadow-2xl relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-extrabold tracking-wide mb-2 flex items-center gap-3">
                <span className="text-5xl">👤</span>
                My Account
              </h1>
              <p className="text-white/90 text-sm">Manage your profile and wallet</p>
            </div>
            <button
              onClick={handleRefreshWallet}
              disabled={wallet.loading}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 px-4 py-2 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {wallet.loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>

          {/* User Profile Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 rounded-full p-4">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-lg font-bold">{user.name || 'User'}</div>
                  {accountStatus ? (
                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span>✓</span> Active
                    </span>
                  ) : (
                    <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span>⏳</span> Pending
                    </span>
                  )}
                </div>
                <div className="text-white/80 text-sm mb-1">{user.phone}</div>
                <div className="text-white/60 text-xs">ID: {user.id?.substring(0, 8)}...</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {wallet.error && (
        <div className="mx-4 mt-4 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <span>Error: {wallet.error}</span>
          </div>
        </div>
      )}

      {/* Account Lock Warning */}
      {auth.isAuthenticated && !checkingPurchase && !hasPurchasedProduct && (
        <div className="mx-4 mt-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-4 shadow-lg text-white border-2 border-red-400">
          <div className="flex items-start gap-3">
            <div className="text-3xl flex-shrink-0">🔒</div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">Account Locked for Withdrawal</h3>
              <p className="text-sm text-white/90 mb-3">
                You must purchase at least one product before you can withdraw funds.
              </p>
              <button
                onClick={() => navigate('/product')}
                className="bg-white text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                Browse Products →
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pt-6 space-y-6">
        {/* VIP Status Card - Premium Display */}
        {vipStatus && vipStatus.vipLevel > 0 && (
          <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 rounded-2xl p-6 shadow-2xl text-white transform hover:scale-[1.02] transition-transform duration-300 border-2 border-yellow-300 relative overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-4 left-4 w-16 h-16 border-3 border-white rounded-full animate-pulse"></div>
              <div className="absolute bottom-4 right-4 w-12 h-12 border-3 border-white rounded-full animate-pulse delay-500"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <div className="text-sm opacity-90 mb-2 flex items-center gap-2">
                    <span className="text-3xl">👑</span>
                    <span className="font-bold text-lg">VIP Status</span>
                  </div>
                  <div className="text-4xl font-black mb-2">
                    {vipStatus.vipLevelName}
                  </div>
                  <div className="text-sm text-white/90 mb-3">
                    {vipStatus.referralCount} Referrals • {vipStatus.referralCount >= 20 ? 'VIP 2 Unlocked!' : vipStatus.referralCount >= 5 ? 'VIP 1 Unlocked!' : `${20 - vipStatus.referralCount} more for VIP 2`}
                  </div>
                </div>
                <div className="text-6xl opacity-30">
                  {vipStatus.vipLevel === 2 ? '💎' : '⭐'}
                </div>
              </div>

              {/* VIP Benefits */}
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/30">
                <div className="text-xs font-bold mb-2 text-yellow-200">VIP Benefits</div>
                <div className="space-y-2 text-sm">
                  {vipStatus.weeklyReward > 0 && (
                    <div className="flex items-center justify-between">
                      <span>💰 Weekly Reward:</span>
                      <span className="font-bold">{formatCurrency(vipStatus.weeklyReward, settings.currency)}</span>
                    </div>
                  )}
                  {vipStatus.monthlyReward > 0 && (
                    <div className="flex items-center justify-between">
                      <span>💎 Monthly Reward:</span>
                      <span className="font-bold">{formatCurrency(vipStatus.monthlyReward, settings.currency)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Next Reward Info */}
              {(vipStatus.nextWeeklyReward || vipStatus.nextMonthlyReward) && (
                <div className="text-xs text-white/80 mb-3">
                  {vipStatus.nextWeeklyReward && (
                    <div>Next Weekly: {new Date(vipStatus.nextWeeklyReward).toLocaleDateString()}</div>
                  )}
                  {vipStatus.nextMonthlyReward && (
                    <div>Next Monthly: {new Date(vipStatus.nextMonthlyReward).toLocaleDateString()}</div>
                  )}
                </div>
              )}

              {/* Claim Rewards Button */}
              <button
                onClick={handleClaimVIPRewards}
                disabled={claimingRewards}
                className="w-full bg-white/30 hover:bg-white/40 backdrop-blur-sm text-white font-bold py-3 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {claimingRewards ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Claiming...
                  </>
                ) : (
                  <>
                    <span>🎁</span>
                    Claim VIP Rewards
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* VIP Progress Card (if not VIP yet) */}
        {vipStatus && vipStatus.vipLevel === 0 && (
          <div className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl p-6 shadow-xl text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <div className="text-sm opacity-90 mb-2 flex items-center gap-2">
                  <span className="text-2xl">📈</span>
                  <span className="font-semibold">VIP Progress</span>
                </div>
                <div className="text-2xl font-bold mb-2">
                  Regular Member
                </div>
                <div className="text-sm text-white/80 mb-4">
                  {vipStatus.referralCount} / 5 referrals for VIP 1
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-white/20 rounded-full h-3 mb-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((vipStatus.referralCount / 5) * 100, 100)}%` }}
                  ></div>
                </div>
                
                <div className="text-xs text-white/60">
                  {5 - vipStatus.referralCount} more referrals needed for VIP 1
                </div>
              </div>
              <div className="text-5xl opacity-30">
                🎯
              </div>
            </div>
          </div>
        )}

        {/* Account Status Card */}
        <div className={`rounded-2xl p-6 shadow-xl text-white transform hover:scale-[1.02] transition-transform duration-300 ${
          accountStatus 
            ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
            : 'bg-gradient-to-br from-orange-500 to-red-600'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm opacity-90 mb-2 flex items-center gap-2">
                <span className="text-2xl">{accountStatus ? '✅' : '⏳'}</span>
                <span className="font-semibold">Account Status</span>
              </div>
              <div className="text-3xl font-extrabold mb-2">
                {accountStatus ? 'Active' : 'Pending Activation'}
              </div>
              {!accountStatus && (
                <div className="text-sm text-white/90">
                  Purchase your first product to activate your account automatically
                </div>
              )}
              {accountStatus && (
                <div className="text-sm text-white/90">
                  Your account is fully active and ready to use
                </div>
              )}
            </div>
            <div className="text-6xl opacity-30">
              {accountStatus ? '🎉' : '🔒'}
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Balance Wallet - Primary */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 shadow-xl text-white transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">💰</div>
              <div className="bg-white/20 rounded-full px-2 py-1 text-xs font-semibold">Balance</div>
            </div>
            <div className="text-2xl font-black mb-1">
              {formatCurrency(getWalletValue(wallet.balanceWallet), settings.currency)}
            </div>
            <div className="text-blue-100 text-xs">Available for withdrawal</div>
          </div>

          {/* Available Earnings */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 shadow-xl text-white transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">💵</div>
              <div className="bg-white/20 rounded-full px-2 py-1 text-xs font-semibold">Earnings</div>
            </div>
            <div className="text-2xl font-black mb-1">
              {formatCurrency(availableEarnings, settings.currency)}
            </div>
            <div className="text-green-100 text-xs">Available to withdraw</div>
          </div>
        </div>

        {/* Wallet Summary Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">💳</span>
            Wallet Summary
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {cards.map((card, idx) => {
              const isEarnings = card.label.includes('earnings') || card.label.includes('Income');
              const isLoss = card.label.includes('loss') || card.label.includes('Loss');
              const isWithdrawal = card.label.includes('withdrawal');
              
              let bgColor = 'from-gray-100 to-gray-200';
              let textColor = 'text-gray-800';
              let icon = '💼';
              
              if (isEarnings) {
                bgColor = 'from-green-100 to-emerald-200';
                textColor = 'text-green-800';
                icon = '📈';
              } else if (isLoss) {
                bgColor = 'from-red-100 to-rose-200';
                textColor = 'text-red-800';
                icon = '📉';
              } else if (isWithdrawal) {
                bgColor = 'from-orange-100 to-amber-200';
                textColor = 'text-orange-800';
                icon = '💸';
              } else if (card.label.includes('Recharge')) {
                bgColor = 'from-blue-100 to-indigo-200';
                textColor = 'text-blue-800';
                icon = '💳';
              } else if (card.label.includes('Balance')) {
                bgColor = 'from-purple-100 to-pink-200';
                textColor = 'text-purple-800';
                icon = '💰';
              }

              return (
                <div
                  key={idx}
                  className={`bg-gradient-to-br ${bgColor} rounded-xl p-4 shadow-md transform hover:scale-105 transition-transform duration-300`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{icon}</span>
                    <div className={`text-xs font-semibold ${textColor} flex-1 line-clamp-2`}>
                      {card.label}
                    </div>
                  </div>
                  <div className={`text-lg font-black ${textColor}`}>
                    {formatCurrency(card.value, settings.currency)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>



        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-xl">⚡</span>
            Quick Actions
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => navigate('/my-teams')}
              className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl p-4 shadow-lg flex flex-col items-center justify-center gap-2 transform hover:scale-105 transition-all duration-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5V9H2v11h5M12 13.01V13"
                />
              </svg>
              <span className="text-xs font-semibold">My Teams</span>
            </button>
            <button
              onClick={() => navigate('/invitation')}
              className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl p-4 shadow-lg flex flex-col items-center justify-center gap-2 transform hover:scale-105 transition-all duration-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 11c2.28 0 4-1.79 4-4s-1.72-4-4-4-4 1.79-4 4 1.72 4 4 4zM6 21v-2a4 4 0 014-4h0a4 4 0 014 4v2"
                />
              </svg>
              <span className="text-xs font-semibold">Invite</span>
            </button>
            <button
              onClick={() => navigate('/my-product')}
              className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-4 shadow-lg flex flex-col items-center justify-center gap-2 transform hover:scale-105 transition-all duration-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 11V7a4 4 0 10-8 0v4M12 14v5m-3 0h6"
                />
              </svg>
              <span className="text-xs font-semibold">Products</span>
            </button>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-xl text-white border border-slate-700">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-xl">📊</span>
            Performance Summary
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-xs text-white/60 mb-1">Net Profit</div>
              <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(netProfit, settings.currency)}
              </div>
              <div className="text-xs text-white/50 mt-1">Earnings - Losses</div>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white py-4 rounded-2xl font-bold shadow-xl transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
};

export default User;