/**
 * VIP Service - Handles VIP level calculation and reward distribution
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  increment,
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// VIP Level Thresholds
export const VIP_LEVELS = {
  NONE: 0,
  VIP1: 1,
  VIP2: 2,
};

export const VIP_THRESHOLDS = {
  [VIP_LEVELS.VIP1]: 5,  // 5 referrals for VIP 1
  [VIP_LEVELS.VIP2]: 20, // 20 referrals for VIP 2
};

export const VIP_REWARDS = {
  [VIP_LEVELS.VIP1]: {
    weekly: 50,  // 50 money per week
    monthly: 0,  // No monthly reward
  },
  [VIP_LEVELS.VIP2]: {
    weekly: 50,   // 50 money per week
    monthly: 2000, // 2000 money per month
  },
};

/**
 * Calculate VIP level based on referral count
 */
export const calculateVIPLevel = (referralCount) => {
  if (referralCount >= VIP_THRESHOLDS[VIP_LEVELS.VIP2]) {
    return VIP_LEVELS.VIP2;
  } else if (referralCount >= VIP_THRESHOLDS[VIP_LEVELS.VIP1]) {
    return VIP_LEVELS.VIP1;
  }
  return VIP_LEVELS.NONE;
};

/**
 * Get VIP level name
 */
export const getVIPLevelName = (level) => {
  switch (level) {
    case VIP_LEVELS.VIP1:
      return 'VIP 1';
    case VIP_LEVELS.VIP2:
      return 'VIP 2';
    default:
      return 'Regular';
  }
};

/**
 * Check and update VIP level for a user
 * This should be called when referral count changes
 */
export const updateVIPLevel = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const referralCount = userData.totalReferrals || 0;
    const currentVIPLevel = userData.vipLevel || VIP_LEVELS.NONE;
    const newVIPLevel = calculateVIPLevel(referralCount);

    // Only update if VIP level changed
    if (newVIPLevel !== currentVIPLevel) {
      await updateDoc(userRef, {
        vipLevel: newVIPLevel,
        vipLevelUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        oldLevel: currentVIPLevel,
        newLevel: newVIPLevel,
        referralCount,
      };
    }

    return {
      success: true,
      oldLevel: currentVIPLevel,
      newLevel: newVIPLevel,
      referralCount,
      changed: false,
    };
  } catch (error) {
    console.error('Error updating VIP level:', error);
    throw error;
  }
};

/**
 * Distribute weekly VIP reward
 * This should be called weekly (e.g., via a scheduled task or on user login)
 */
export const distributeWeeklyVIPReward = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const vipLevel = userData.vipLevel || VIP_LEVELS.NONE;

    // Check if user is VIP
    if (vipLevel === VIP_LEVELS.NONE) {
      return {
        success: false,
        message: 'User is not a VIP member',
      };
    }

    const rewardAmount = VIP_REWARDS[vipLevel]?.weekly || 0;

    if (rewardAmount <= 0) {
      return {
        success: false,
        message: 'No weekly reward for this VIP level',
      };
    }

    // Check last weekly reward date
    const lastWeeklyReward = userData.lastWeeklyReward;
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Check if already received reward this week
    if (lastWeeklyReward) {
      const lastRewardDate = lastWeeklyReward.toMillis
        ? new Date(lastWeeklyReward.toMillis())
        : new Date(lastWeeklyReward);

      if (lastRewardDate > oneWeekAgo) {
        const daysUntilNext = Math.ceil((lastRewardDate.getTime() + 7 * 24 * 60 * 60 * 1000 - now.getTime()) / (24 * 60 * 60 * 1000));
        return {
          success: false,
          message: `Weekly reward already received. Next reward in ${daysUntilNext} days.`,
          alreadyReceived: true,
        };
      }
    }

    // Get or create wallet
    const walletRef = doc(db, 'wallets', userId);
    const walletDoc = await getDoc(walletRef);

    if (!walletDoc.exists()) {
      // Create wallet if doesn't exist
      await updateDoc(walletRef, {
        userId,
        rechargeWallet: 0,
        balanceWallet: rewardAmount,
        totalEarnings: rewardAmount,
        totalWithdrawals: 0,
        incomeToday: rewardAmount,
        incomeYesterday: 0,
        lossToday: 0,
        lossTotal: 0,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Add reward to wallet
      await updateDoc(walletRef, {
        balanceWallet: increment(rewardAmount),
        totalEarnings: increment(rewardAmount),
        incomeToday: increment(rewardAmount),
        updatedAt: serverTimestamp(),
      });
    }

    // Update user's last weekly reward date
    await updateDoc(userRef, {
      lastWeeklyReward: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create transaction record
    await addDoc(collection(db, 'transactions'), {
      userId,
      type: 'vip_weekly_reward',
      amount: rewardAmount,
      status: 'completed',
      vipLevel,
      description: `VIP ${vipLevel} Weekly Reward`,
      transactionId: 'VIP_WEEKLY_' + Date.now(),
      createdAt: serverTimestamp(),
    });

    return {
      success: true,
      amount: rewardAmount,
      vipLevel,
      message: `Weekly VIP reward of ${rewardAmount} added to balance`,
    };
  } catch (error) {
    console.error('Error distributing weekly VIP reward:', error);
    throw error;
  }
};

/**
 * Distribute monthly VIP reward
 * This should be called monthly (e.g., via a scheduled task or on user login)
 */
export const distributeMonthlyVIPReward = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const vipLevel = userData.vipLevel || VIP_LEVELS.NONE;

    // Only VIP 2 gets monthly rewards
    if (vipLevel !== VIP_LEVELS.VIP2) {
      return {
        success: false,
        message: 'Monthly rewards are only for VIP 2 members',
      };
    }

    const rewardAmount = VIP_REWARDS[VIP_LEVELS.VIP2]?.monthly || 0;

    if (rewardAmount <= 0) {
      return {
        success: false,
        message: 'No monthly reward configured',
      };
    }

    // Check last monthly reward date
    const lastMonthlyReward = userData.lastMonthlyReward;
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Check if already received reward this month
    if (lastMonthlyReward) {
      const lastRewardDate = lastMonthlyReward.toMillis
        ? new Date(lastMonthlyReward.toMillis())
        : new Date(lastMonthlyReward);

      if (lastRewardDate > oneMonthAgo) {
        const daysUntilNext = Math.ceil((lastRewardDate.getTime() + 30 * 24 * 60 * 60 * 1000 - now.getTime()) / (24 * 60 * 60 * 1000));
        return {
          success: false,
          message: `Monthly reward already received. Next reward in ${daysUntilNext} days.`,
          alreadyReceived: true,
        };
      }
    }

    // Get or create wallet
    const walletRef = doc(db, 'wallets', userId);
    const walletDoc = await getDoc(walletRef);

    if (!walletDoc.exists()) {
      // Create wallet if doesn't exist
      await setDoc(walletRef, {
        userId,
        rechargeWallet: 0,
        balanceWallet: rewardAmount,
        totalEarnings: rewardAmount,
        totalWithdrawals: 0,
        incomeToday: rewardAmount,
        incomeYesterday: 0,
        lossToday: 0,
        lossTotal: 0,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Add reward to wallet
      await updateDoc(walletRef, {
        balanceWallet: increment(rewardAmount),
        totalEarnings: increment(rewardAmount),
        incomeToday: increment(rewardAmount),
        updatedAt: serverTimestamp(),
      });
    }

    // Update user's last monthly reward date
    await updateDoc(userRef, {
      lastMonthlyReward: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create transaction record
    await addDoc(collection(db, 'transactions'), {
      userId,
      type: 'vip_monthly_reward',
      amount: rewardAmount,
      status: 'completed',
      vipLevel,
      description: `VIP ${vipLevel} Monthly Reward`,
      transactionId: 'VIP_MONTHLY_' + Date.now(),
      createdAt: serverTimestamp(),
    });

    return {
      success: true,
      amount: rewardAmount,
      vipLevel,
      message: `Monthly VIP reward of ${rewardAmount} added to balance`,
    };
  } catch (error) {
    console.error('Error distributing monthly VIP reward:', error);
    throw error;
  }
};

/**
 * Check and distribute all pending VIP rewards for a user
 * This should be called on user login or when viewing the User page
 */
export const checkAndDistributeVIPRewards = async (userId) => {
  try {
    const results = {
      weekly: null,
      monthly: null,
    };

    // Check weekly reward
    try {
      results.weekly = await distributeWeeklyVIPReward(userId);
    } catch (error) {
      console.error('Error checking weekly reward:', error);
      results.weekly = { success: false, error: error.message };
    }

    // Check monthly reward
    try {
      results.monthly = await distributeMonthlyVIPReward(userId);
    } catch (error) {
      console.error('Error checking monthly reward:', error);
      results.monthly = { success: false, error: error.message };
    }

    return results;
  } catch (error) {
    console.error('Error checking VIP rewards:', error);
    throw error;
  }
};
