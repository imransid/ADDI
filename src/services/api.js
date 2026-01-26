/**
 * API Service - Firebase Firestore backend
 * All data is stored and retrieved from Firebase Firestore
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  addDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Simple password hashing (for production, use a proper hashing library)
const hashPassword = (password) => {
  // Simple hash for demo - in production use bcrypt or similar
  return btoa(password);
};

const verifyPassword = (password, hashedPassword) => {
  return btoa(password) === hashedPassword;
};

// Generate a simple token (for demo purposes)
const generateToken = () => 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

// Auth API
export const authAPI = {
  login: async (identifier, password, loginType = 'phone') => {
    try {
      const usersRef = collection(db, 'users');
      let querySnapshot;
      
      // For consumers, allow login with NID or Passport
      // For admins, use phone (backward compatibility)
      if (loginType === 'nid') {
        const q = query(usersRef, where('nid', '==', identifier));
        querySnapshot = await getDocs(q);
      } else if (loginType === 'passport') {
        const q = query(usersRef, where('passport', '==', identifier));
        querySnapshot = await getDocs(q);
      } else {
        // Default: phone login (for admins and backward compatibility)
        const q = query(usersRef, where('phone', '==', identifier));
        querySnapshot = await getDocs(q);
      }

      if (querySnapshot.empty) {
        throw new Error('Invalid credentials');
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Verify password
      if (!verifyPassword(password, userData.password)) {
        throw new Error('Invalid credentials');
      }

      // Check if user is active (admins are always active)
      const isActive = userData.isActive !== undefined ? userData.isActive : (userData.role === 'admin' ? true : false);
      
      if (!isActive && userData.role !== 'admin') {
        throw new Error('Your account is not active. Please contact an administrator.');
      }

      // Update last login
      await updateDoc(doc(db, 'users', userDoc.id), {
        lastLogin: serverTimestamp(),
      });

      const token = generateToken();

      return {
        success: true,
        data: {
          token,
          user: {
            id: userDoc.id,
            phone: userData.phone,
            name: userData.name,
            role: userData.role || 'consumer',
            isActive: isActive,
          },
        },
      };
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  },

  register: async (name, phone, password, referralCode = null) => {
    try {
      // Check if user already exists by phone
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phone', '==', phone));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        throw new Error('Phone number already registered');
      }

      // Generate unique referral code for new user (8 characters)
      const generateRefCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };

      let newReferralCode = generateRefCode();
      let referrerId = null;

      // Check if referral code is valid and find referrer
      if (referralCode) {
        // Try to find user by referral code
        const refQuery = query(usersRef, where('referralCode', '==', referralCode));
        const refSnapshot = await getDocs(refQuery);
        
        if (!refSnapshot.empty) {
          const referrerDoc = refSnapshot.docs[0];
          referrerId = referrerDoc.id;
        } else {
          // Fallback: try finding by user ID (for backward compatibility)
          const refByIdDoc = await getDoc(doc(db, 'users', referralCode));
          if (refByIdDoc.exists()) {
            referrerId = refByIdDoc.id;
          }
        }
      }

      // Create new user
      const hashedPassword = hashPassword(password);
      const newUserRef = doc(collection(db, 'users'));

      // All registered users are consumers only
      await setDoc(newUserRef, {
        name,
        phone,
        password: hashedPassword,
        role: 'consumer',
        isActive: true, // Consumers are automatically approved on sign up
        referralCode: newReferralCode,
        referredBy: referrerId || null,
        totalReferrals: 0,
        createdAt: serverTimestamp(),
        lastLogin: null,
      });

      // Initialize wallet for new user
      await setDoc(doc(db, 'wallets', newUserRef.id), {
        userId: newUserRef.id,
        rechargeWallet: 0,
        // No signup bonus for referred users. Referrer is rewarded after the
        // referred user's first successful product purchase.
        balanceWallet: 0,
        totalEarnings: 0,
        totalWithdrawals: 0,
        incomeToday: 0,
        incomeYesterday: 0,
        lossToday: 0,
        lossTotal: 0,
        updatedAt: serverTimestamp(),
      });

      // Update referrer's referral count (bonus will be given when referred user purchases)
      if (referrerId) {
        const referrerRef = doc(db, 'users', referrerId);
        const referrerDoc = await getDoc(referrerRef);
        if (referrerDoc.exists()) {
          // Update referral count
          await updateDoc(referrerRef, {
            totalReferrals: increment(1),
            updatedAt: serverTimestamp(),
          });

          // Check and update VIP level for referrer
          try {
            const { updateVIPLevel } = await import('./vipService');
            await updateVIPLevel(referrerId);
          } catch (vipError) {
            console.error('Error updating VIP level:', vipError);
            // Don't fail registration if VIP update fails
          }
        }
      }

      const token = generateToken();

      return {
        success: true,
        data: {
          token,
          user: {
            id: newUserRef.id,
            phone,
            name,
            role: 'consumer',
            isActive: true, // Consumers are automatically activated on sign up
          },
          referralBonus: 0,
        },
      };
    } catch (error) {
      throw new Error(error.message || 'Registration failed');
    }
  },

  logout: async () => {
    // Clear all local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { success: true };
  },

  // Verify user identity using Passport or NID
  verifyIdentity: async (idType, idNumber) => {
    try {
      const usersRef = collection(db, 'users');
      let querySnapshot;
      
      if (idType === 'nid') {
        const q = query(usersRef, where('nid', '==', idNumber));
        querySnapshot = await getDocs(q);
      } else if (idType === 'passport') {
        const q = query(usersRef, where('passport', '==', idNumber));
        querySnapshot = await getDocs(q);
      } else {
        throw new Error('Invalid ID type. Must be "nid" or "passport"');
      }

      if (querySnapshot.empty) {
        throw new Error(`${idType === 'nid' ? 'NID' : 'Passport'} not found`);
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      return {
        success: true,
        data: {
          userId: userDoc.id,
          phone: userData.phone,
          name: userData.name,
        },
      };
    } catch (error) {
      throw new Error(error.message || 'Identity verification failed');
    }
  },

  // Reset password after identity verification
  resetPassword: async (userId, newPassword) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      // Hash and update password
      const hashedPassword = hashPassword(newPassword);
      await updateDoc(userRef, {
        password: hashedPassword,
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        message: 'Password reset successfully',
      };
    } catch (error) {
      throw new Error(error.message || 'Password reset failed');
    }
  },
};

// User API
export const userAPI = {
  getUserProfile: async (token) => {
    try {
      // Get user ID from token or stored user data
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User not found');

      const user = JSON.parse(userStr);
      const userDoc = await getDoc(doc(db, 'users', user.id));

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();

      return {
        success: true,
        data: {
          id: userDoc.id,
          phone: userData.phone,
          name: userData.name,
          role: userData.role || 'user',
          isActive: userData.isActive !== undefined ? userData.isActive : false,
        },
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch profile');
    }
  },

  updateProfile: async (token, data) => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User not found');

      const user = JSON.parse(userStr);
      const userRef = doc(db, 'users', user.id);

      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });

      const updatedDoc = await getDoc(userRef);

      return {
        success: true,
        data: { id: updatedDoc.id, ...updatedDoc.data() },
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to update profile');
    }
  },

  // Get referral statistics (total referrals, purchased, not purchased)
  getReferralStatistics: async (token) => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User not found');

      const user = JSON.parse(userStr);
      
      // Get all users referred by this user
      const usersRef = collection(db, 'users');
      const referralsQuery = query(usersRef, where('referredBy', '==', user.id));
      const referralsSnapshot = await getDocs(referralsQuery);
      
      const totalReferrals = referralsSnapshot.size;
      let purchasedCount = 0;
      let notPurchasedCount = 0;
      
      // Check each referral's purchase status
      const referralChecks = referralsSnapshot.docs.map(async (referralDoc) => {
        const referralId = referralDoc.id;
        const userProductsRef = collection(db, 'userProducts');
        const purchaseQuery = query(userProductsRef, where('userId', '==', referralId));
        const purchaseSnapshot = await getDocs(purchaseQuery);
        return !purchaseSnapshot.empty;
      });
      
      const purchaseStatuses = await Promise.all(referralChecks);
      purchaseStatuses.forEach((hasPurchased) => {
        if (hasPurchased) {
          purchasedCount++;
        } else {
          notPurchasedCount++;
        }
      });

      return {
        success: true,
        data: {
          totalReferrals,
          purchasedCount,
          notPurchasedCount,
        },
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch referral statistics');
    }
  },
};

// Wallet API
export const walletAPI = {
  getWallet: async (token) => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User not found');

      const user = JSON.parse(userStr);
      const walletDoc = await getDoc(doc(db, 'wallets', user.id));

      if (!walletDoc.exists()) {
        // Create wallet if doesn't exist
        await setDoc(doc(db, 'wallets', user.id), {
          userId: user.id,
          rechargeWallet: 0,
          balanceWallet: 0,
          totalEarnings: 0,
          totalWithdrawals: 0,
          incomeToday: 0,
          incomeYesterday: 0,
          lossToday: 0,
          lossTotal: 0,
          updatedAt: serverTimestamp(),
        });

        return {
          success: true,
          data: {
            rechargeWallet: 0,
            balanceWallet: 0,
            totalEarnings: 0,
            totalWithdrawals: 0,
            incomeToday: 0,
            incomeYesterday: 0,
            lossToday: 0,
            lossTotal: 0,
          },
        };
      }

      const walletData = walletDoc.data();
      
    

      // Ensure all values are numbers, handle null/undefined
      const rechargeWallet = walletData.rechargeWallet != null ? Number(walletData.rechargeWallet) : 0;
      const balanceWallet = walletData.balanceWallet != null ? Number(walletData.balanceWallet) : 0;
      const totalEarnings = walletData.totalEarnings != null ? Number(walletData.totalEarnings) : 0;
      const totalWithdrawals = walletData.totalWithdrawals != null ? Number(walletData.totalWithdrawals) : 0;
      const incomeToday = walletData.incomeToday != null ? Number(walletData.incomeToday) : 0;
      const incomeYesterday = walletData.incomeYesterday != null ? Number(walletData.incomeYesterday) : 0;
      const lossToday = walletData.lossToday != null ? Number(walletData.lossToday) : 0;
      const lossTotal = walletData.lossTotal != null ? Number(walletData.lossTotal) : 0;

      const walletResponse = {
        success: true,
        data: {
          rechargeWallet: isNaN(rechargeWallet) ? 0 : rechargeWallet,
          balanceWallet: isNaN(balanceWallet) ? 0 : balanceWallet,
          totalEarnings: isNaN(totalEarnings) ? 0 : totalEarnings,
          totalWithdrawals: isNaN(totalWithdrawals) ? 0 : totalWithdrawals,
          incomeToday: isNaN(incomeToday) ? 0 : incomeToday,
          incomeYesterday: isNaN(incomeYesterday) ? 0 : incomeYesterday,
          lossToday: isNaN(lossToday) ? 0 : lossToday,
          lossTotal: isNaN(lossTotal) ? 0 : lossTotal,
        },
      };

      return walletResponse;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch wallet');
    }
  },

  recharge: async (token, amount, proofImageUrl = '') => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User not found');

      const user = JSON.parse(userStr);

      // Ensure amount is a number
      const amountNumber = typeof amount === 'number' ? amount : parseFloat(amount);
      if (isNaN(amountNumber) || amountNumber <= 0) {
        throw new Error('Invalid recharge amount');
      }

      // Create pending recharge request
      const transactionRef = await addDoc(collection(db, 'transactions'), {
        userId: user.id,
        type: 'recharge',
        amount: amountNumber, // Store as number
        status: 'pending',
        proofImageUrl: proofImageUrl || '',
        transactionId: 'TXN_' + Date.now(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        data: {
          transactionId: transactionRef.id,
          status: 'pending',
          message: 'Recharge request submitted. Waiting for admin approval.',
        },
      };
    } catch (error) {
      throw new Error(error.message || 'Recharge failed');
    }
  },

  withdraw: async (token, amount, paymentMethod = null, paymentDetails = null, vatTax = null, netAmount = null) => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User not found');

      const user = JSON.parse(userStr);
      const walletRef = doc(db, 'wallets', user.id);

      // Get current wallet
      const walletDoc = await getDoc(walletRef);
      if (!walletDoc.exists()) {
        throw new Error('Wallet not found');
      }

      const walletData = walletDoc.data();
      const currentBalance = walletData.balanceWallet != null ? Number(walletData.balanceWallet) : 0;
      
      // Check if withdrawals are allowed (only Saturday and Sunday)
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        throw new Error(`Withdrawals are only available on Saturday and Sunday. Today is ${dayNames[dayOfWeek]}.`);
      }
      
      // Check if user has purchased any products (account lock check)
      const userProductsRef = collection(db, 'userProducts');
      const purchaseQuery = query(userProductsRef, where('userId', '==', user.id));
      const purchaseSnapshot = await getDocs(purchaseQuery);
      
      if (purchaseSnapshot.empty) {
        throw new Error('Account is locked. You must purchase at least one product before you can withdraw.');
      }
      
      // Check if user has sufficient balance
      if (amount > currentBalance) {
        throw new Error(`Insufficient balance. Available balance: ${currentBalance.toFixed(2)}`);
      }

      // Calculate VAT tax if not provided (10% of withdrawal amount)
      const calculatedVatTax = vatTax !== null ? vatTax : amount * 0.10;
      const calculatedNetAmount = netAmount !== null ? netAmount : amount - calculatedVatTax;

      const newBalance = currentBalance - amount;

      // Deduct full amount from balance (VAT is deducted from the withdrawal, not the balance)
      // The full requested amount is deducted, but user receives netAmount after VAT
      await updateDoc(walletRef, {
        balanceWallet: increment(-amount),
        totalWithdrawals: increment(amount),
        updatedAt: serverTimestamp(),
      });

      // Create transaction record with pending status (admin approval required)
      const transactionData = {
        userId: user.id,
        type: 'withdraw',
        amount, // Full withdrawal amount
        vatTax: calculatedVatTax, // VAT tax (10%)
        netAmount: calculatedNetAmount, // Amount user will receive after VAT
        status: 'pending', // Pending admin approval
        transactionId: 'TXN_' + Date.now(),
        createdAt: serverTimestamp(),
      };

      // Add payment method details if provided
      if (paymentMethod && paymentDetails) {
        transactionData.paymentMethod = paymentMethod;
        transactionData.paymentName = paymentDetails.name;
        transactionData.paymentNumber = paymentDetails.number;
      }

      const transactionRef = await addDoc(collection(db, 'transactions'), transactionData);

      return {
        success: true,
        data: {
          transactionId: transactionRef.id,
          newBalance,
          status: 'pending', // Inform user that withdrawal is pending approval
        },
      };
    } catch (error) {
      throw new Error(error.message || 'Withdrawal failed');
    }
  },

  getWithdrawalHistory: async (token) => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User not found');

      const user = JSON.parse(userStr);
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('userId', '==', user.id),
        where('type', '==', 'withdraw')
      );
      const querySnapshot = await getDocs(q);

      let withdrawals = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort by createdAt descending (most recent first)
      withdrawals.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
        const timeB = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
        return timeB - timeA;
      });

      return {
        success: true,
        data: { withdrawals },
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch withdrawal history');
    }
  },
};

// Team API
export const teamAPI = {
  getTeam: async (token) => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User not found');

      const user = JSON.parse(userStr);

      // Get team data from Firestore
      const teamDoc = await getDoc(doc(db, 'teams', user.id));

      if (teamDoc.exists()) {
        const teamData = teamDoc.data();
        return {
          success: true,
          data: teamData,
        };
      }

      // Return default structure if team doesn't exist
      const defaultTeam = {
        userId: user.id,
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
      };

      // Create team document with default data
      await setDoc(doc(db, 'teams', user.id), {
        ...defaultTeam,
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        data: defaultTeam,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch team data');
    }
  },
};

// Product API
export const productAPI = {
  getProducts: async (token) => {
    try {
      const productsRef = collection(db, 'products');
      const querySnapshot = await getDocs(productsRef);

      if (querySnapshot.empty) {
        // Create default products if none exist
        const defaultProducts = [
          { name: 'Product 1', price: 100 },
          { name: 'Product 2', price: 200 },
        ];

        const createdProducts = [];
        for (const product of defaultProducts) {
          const newProductRef = await addDoc(productsRef, {
            ...product,
            createdAt: serverTimestamp(),
          });
          createdProducts.push({ id: newProductRef.id, ...product });
        }

        return {
          success: true,
          data: {
            products: createdProducts,
          },
        };
      }

      const products = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        success: true,
        data: { products },
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch products');
    }
  },

  addProduct: async (token, productData) => {
    try {
      const productsRef = collection(db, 'products');
      const validityDaysNumber = Number(productData.validityDays);
      let validityDays =
        !Number.isNaN(validityDaysNumber) && validityDaysNumber > 0
          ? Math.floor(validityDaysNumber)
          : null;
      if (!validityDays && !productData.validateDate) validityDays = 45;

      const productDoc = {
        name: productData.name,
        price: productData.price,
        description: productData.description || '',
        imageUrl: productData.imageUrl || '',
        // Prefer validityDays (duration). validateDate is kept for backward compatibility.
        validityDays: validityDays,
        validateDate: productData.validateDate || null,
        earnAmount: productData.earnAmount || 0,
        totalEarning: productData.totalEarning || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const newProductRef = await addDoc(productsRef, productDoc);

      return {
        success: true,
        data: { id: newProductRef.id, ...productDoc },
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to add product');
    }
  },

  updateProduct: async (token, productId, productData) => {
    try {
      // Check if productId is a temporary ID (shouldn't happen after fix, but handle gracefully)
      if (productId && productId.startsWith('temp_')) {
        throw new Error('Invalid product ID. Please refresh the page and try again.');
      }

      const productRef = doc(db, 'products', productId);
      
      // Check if document exists before updating
      const productSnap = await getDoc(productRef);
      if (!productSnap.exists()) {
        throw new Error(`Product with ID "${productId}" does not exist. Please refresh the page and try again.`);
      }

      await updateDoc(productRef, {
        ...productData,
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        data: { id: productId, ...productData },
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to update product');
    }
  },

  deleteProduct: async (token, productId) => {
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        deleted: true,
        deletedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      throw new Error(error.message || 'Failed to delete product');
    }
  },

  // Purchase a product
  purchaseProduct: async (token, productId) => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User not found');

      const user = JSON.parse(userStr);
      
      // Get product details
      const productDoc = await getDoc(doc(db, 'products', productId));
      if (!productDoc.exists()) {
        throw new Error('Product not found');
      }

      const productData = productDoc.data();
      if (productData.deleted) {
        throw new Error('Product is no longer available');
      }

      // Get user wallet
      const walletDoc = await getDoc(doc(db, 'wallets', user.id));
      if (!walletDoc.exists()) {
        throw new Error('Wallet not found');
      }

      const walletData = walletDoc.data();
      const rechargeWallet = walletData.rechargeWallet || 0;

      // Check if user has enough balance
      if (rechargeWallet < productData.price) {
        throw new Error('Insufficient balance in recharge wallet');
      }

      // Check if this is user's first purchase
      const userProductsRef = collection(db, 'userProducts');
      const purchaseQuery = query(userProductsRef, where('userId', '==', user.id));
      const purchaseSnapshot = await getDocs(purchaseQuery);
      const isFirstPurchase = purchaseSnapshot.empty;

      // Get user document (needed for account activation and referral bonus)
      const userRef = doc(db, 'users', user.id);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.exists() ? userDoc.data() : null;

      // Deduct from recharge wallet
      await updateDoc(doc(db, 'wallets', user.id), {
        rechargeWallet: increment(-productData.price),
        updatedAt: serverTimestamp(),
      });

      // Auto-activate account on first purchase
      let accountActivated = false;
      if (isFirstPurchase && userData && !userData.isActive) {
        await updateDoc(userRef, {
          isActive: true,
          activatedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        accountActivated = true;
        
        // Update localStorage user object
        const updatedUser = { ...user, isActive: true };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      // Mark first purchase time for "active referral" logic (Prize eligibility)
      if (isFirstPurchase && userData && !userData.firstPurchaseAt) {
        try {
          await updateDoc(userRef, {
            firstPurchaseAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (fpError) {
          console.error('Failed to set firstPurchaseAt:', fpError);
        }
      }

      // Create user product purchase record
      // Handle validateDate (legacy) and validityDays (preferred duration)
      const nowDate = new Date();
      const msPerDay = 1000 * 60 * 60 * 24;

      let validateDateValue = null;
      let derivedValidityDays = null;

      if (productData.validateDate) {
        // If it's already a Firestore Timestamp, use it directly
        // If it's a Date object, Firestore will convert it automatically
        validateDateValue = productData.validateDate;

        // Also derive a validityDays value for UI (used/total display)
        const validateDateAsDate = productData.validateDate?.toMillis
          ? new Date(productData.validateDate.toMillis())
          : new Date(productData.validateDate);
        if (!Number.isNaN(validateDateAsDate?.getTime?.())) {
          derivedValidityDays = Math.max(0, Math.ceil((validateDateAsDate - nowDate) / msPerDay));
        }
      }

      const validityDaysNumber = Number(productData.validityDays);
      const validityDays =
        !Number.isNaN(validityDaysNumber) && validityDaysNumber > 0
          ? Math.floor(validityDaysNumber)
          : (derivedValidityDays ?? 45);

      const purchaseRef = await addDoc(collection(db, 'userProducts'), {
        userId: user.id,
        productId: productId,
        productName: productData.name,
        productPrice: productData.price,
        productDescription: productData.description || '',
        imageUrl: productData.imageUrl || '', // Product image URL
        purchaseDate: serverTimestamp(),
        status: 'active', // active, expired
        validateDate: validateDateValue, // Optional legacy absolute expiry date
        validityDays: validityDays, // Preferred validity duration (days)
        earnAmount: productData.earnAmount || 0, // Daily earn amount from product
        // New earning schedule:
        // - 3-hour earning window every 24 hours
        // - After the 3-hour window ends, user waits 21 hours until the next window
        // We store the next/current window start here.
        earnWindowStartAt: serverTimestamp(),
        lastEarnAttempt: null, // Legacy (no longer used for timing)
        totalEarnings: 0,
        createdAt: serverTimestamp(),
      });

      // Create transaction record
      await addDoc(collection(db, 'transactions'), {
        userId: user.id,
        type: 'purchase',
        amount: productData.price,
        status: 'completed',
        productId: productId,
        purchaseId: purchaseRef.id,
        transactionId: 'TXN_' + Date.now(),
        createdAt: serverTimestamp(),
      });

      // Check if user has a referrer and give bonus ONLY on the referred user's first purchase
      if (userData) {
        const referrerId = userData.referredBy;
        const referralBonusGranted = !!userData.referralPurchaseBonusGranted;
        
        if (referrerId && isFirstPurchase && !referralBonusGranted) {
          // Get referral bonus amount from settings
          let referralBonus = 200; // Default fallback
          try {
            const settingsDoc = await getDoc(doc(db, 'settings', 'app'));
            if (settingsDoc.exists()) {
              referralBonus = settingsDoc.data().referralBonus || 200;
            }
          } catch (error) {
            console.error('Failed to fetch referral bonus from settings, using default:', error);
          }
          
          // Get referrer's wallet
          const referrerWalletRef = doc(db, 'wallets', referrerId);
          const referrerWalletDoc = await getDoc(referrerWalletRef);
          
          if (referrerWalletDoc.exists()) {
            // Add bonus to referrer's balance and earnings
            await updateDoc(referrerWalletRef, {
              balanceWallet: increment(referralBonus),
              totalEarnings: increment(referralBonus),
              incomeToday: increment(referralBonus),
              updatedAt: serverTimestamp(),
            });
          } else {
            // Create wallet if it doesn't exist
            await setDoc(referrerWalletRef, {
              userId: referrerId,
              rechargeWallet: 0,
              balanceWallet: referralBonus,
              totalEarnings: referralBonus,
              totalWithdrawals: 0,
              incomeToday: referralBonus,
              incomeYesterday: 0,
              lossToday: 0,
              lossTotal: 0,
              updatedAt: serverTimestamp(),
            });
          }
          
          // Get referrer's name for transaction description
          const referrerUserDoc = await getDoc(doc(db, 'users', referrerId));
          const referrerName = referrerUserDoc.exists() ? referrerUserDoc.data().name : 'Unknown';
          
          // Create transaction record for referrer's bonus
          await addDoc(collection(db, 'transactions'), {
            userId: referrerId,
            type: 'referral_purchase_bonus',
            amount: referralBonus,
            status: 'completed',
            description: `Referral bonus for ${userData.name || 'user'}'s product purchase`,
            referredUserId: user.id,
            referredUserPurchaseId: purchaseRef.id,
            transactionId: 'REF_PURCHASE_' + Date.now() + '_' + referrerId,
            createdAt: serverTimestamp(),
          });

          // Mark bonus as granted on referred user's profile to avoid repeats
          // (extra safety on top of the "first purchase" check).
          try {
            await updateDoc(userRef, {
              referralPurchaseBonusGranted: true,
              referralPurchaseBonusGrantedAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } catch (flagError) {
            console.error('Failed to flag referral bonus as granted:', flagError);
          }
        }
      }

      return {
        success: true,
        data: {
          purchaseId: purchaseRef.id,
          product: {
            id: productId,
            name: productData.name,
            price: productData.price,
          },
          accountActivated: accountActivated,
        },
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to purchase product');
    }
  },

  // Get user's purchased products
  getUserProducts: async (token) => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User not found');

      const user = JSON.parse(userStr);
      
      // Get user's purchased products
      const userProductsRef = collection(db, 'userProducts');
      const q = query(userProductsRef, where('userId', '==', user.id));
      const querySnapshot = await getDocs(q);

      const userProducts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch missing imageUrls from original products if needed
      const productIdsToFetch = userProducts
        .filter(p => !p.imageUrl && p.productId)
        .map(p => p.productId);
      
      const productImageMap = {};
      if (productIdsToFetch.length > 0) {
        const productPromises = productIdsToFetch.map(async (productId) => {
          try {
            const productDoc = await getDoc(doc(db, 'products', productId));
            if (productDoc.exists()) {
              const productData = productDoc.data();
              if (productData.imageUrl) {
                productImageMap[productId] = productData.imageUrl;
              }
            }
          } catch (error) {
            console.error(`Failed to fetch image for product ${productId}:`, error);
          }
        });
        await Promise.all(productPromises);
      }

      // Separate into unexpired and expired
      const now = new Date();
      const unexpired = [];
      const expired = [];

      userProducts.forEach((product) => {
        // Add imageUrl from original product if missing
        if (!product.imageUrl && product.productId && productImageMap[product.productId]) {
          product.imageUrl = productImageMap[product.productId];
          // Update the userProduct document with the imageUrl (async, don't wait)
          updateDoc(doc(db, 'userProducts', product.id), {
            imageUrl: productImageMap[product.productId],
            updatedAt: serverTimestamp(),
          }).catch(err => console.error('Failed to update product imageUrl:', err));
        }
        // Use validateDate if available, otherwise fall back to validityDays
        let expiryDate;
        if (product.validateDate) {
          // validateDate is a Firestore Timestamp or Date
          expiryDate = product.validateDate?.toMillis 
            ? new Date(product.validateDate.toMillis()) 
            : new Date(product.validateDate);
        } else {
          // Fallback to old validityDays logic
          const purchaseDate = product.purchaseDate?.toMillis ? new Date(product.purchaseDate.toMillis()) : new Date(product.purchaseDate);
          const validityDays = product.validityDays || 45;
          expiryDate = new Date(purchaseDate);
          expiryDate.setDate(expiryDate.getDate() + validityDays);
        }

        if (expiryDate > now && product.status === 'active') {
          unexpired.push({
            ...product,
            expiryDate: expiryDate,
            daysRemaining: Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)),
          });
        } else {
          // Mark as expired if past validation date
          if (expiryDate <= now && product.status === 'active') {
            // Auto-update status to expired (async, don't wait)
            updateDoc(doc(db, 'userProducts', product.id), {
              status: 'expired',
              updatedAt: serverTimestamp(),
            }).catch(err => console.error('Failed to update product status:', err));
          }
          expired.push({
            ...product,
            expiryDate: expiryDate,
          });
        }
      });

      return {
        success: true,
        data: {
          unexpired,
          expired,
        },
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch user products');
    }
  },

  // Earn from a product (3-hour window every 24 hours)
  earnFromProduct: async (token, userProductId) => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User not found');

      const user = JSON.parse(userStr);
      const now = Date.now();

      // Get user product
      const userProductRef = doc(db, 'userProducts', userProductId);
      const userProductDoc = await getDoc(userProductRef);
      
      if (!userProductDoc.exists()) {
        throw new Error('Product not found');
      }

      const userProduct = userProductDoc.data();

      // Check if product is expired
      let expiryDate;
      if (userProduct.validateDate) {
        expiryDate = userProduct.validateDate?.toMillis 
          ? new Date(userProduct.validateDate.toMillis()) 
          : new Date(userProduct.validateDate);
      } else {
        const purchaseDate = userProduct.purchaseDate?.toMillis ? new Date(userProduct.purchaseDate.toMillis()) : new Date(userProduct.purchaseDate);
        const validityDays = userProduct.validityDays || 45;
        expiryDate = new Date(purchaseDate);
        expiryDate.setDate(expiryDate.getDate() + validityDays);
      }

      if (expiryDate <= new Date()) {
        throw new Error('Product has expired');
      }

      // Check if product has earn amount
      const earnAmount = userProduct.earnAmount || 0;
      if (earnAmount <= 0) {
        throw new Error('This product does not have an earn amount configured');
      }

      const THREE_HOURS = 3 * 60 * 60 * 1000;
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

      const toMs = (ts) =>
        ts?.toMillis ? ts.toMillis() : (ts ? new Date(ts).getTime() : null);

      // `earnWindowStartAt` defines the start of the earning window for this product.
      // Window is open for 3 hours. Next window starts 24 hours after the previous window start.
      // Backward compatibility: if missing, anchor to `purchaseDate` so the window still
      // expires even if user never clicks "Earn".
      let baseWindowStartMs = toMs(userProduct.earnWindowStartAt) ?? toMs(userProduct.purchaseDate);

      // If still missing (should be rare), initialize window starting now.
      if (!baseWindowStartMs) {
        await updateDoc(userProductRef, {
          earnWindowStartAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        baseWindowStartMs = now;
      } else if (!userProduct.earnWindowStartAt) {
        // Persist the derived anchor once so all clients behave consistently.
        await updateDoc(userProductRef, {
          earnWindowStartAt: new Date(baseWindowStartMs),
          updatedAt: serverTimestamp(),
        });
      }

      // Bring the window start forward to the most recent cycle that started <= now.
      const cyclesElapsed = Math.floor(Math.max(0, now - baseWindowStartMs) / TWENTY_FOUR_HOURS);
      const windowStartMs = baseWindowStartMs + cyclesElapsed * TWENTY_FOUR_HOURS;
      const windowEndMs = windowStartMs + THREE_HOURS;

      if (now < windowStartMs) {
        const timeRemaining = windowStartMs - now;
        const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
        const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);
        throw new Error(`Earning not available yet. Window opens in ${hours}h ${minutes}m ${seconds}s`);
      }

      if (now > windowEndMs) {
        // Missed this cycle's 3-hour earning window.
        const nextWindowStartMs = windowStartMs + TWENTY_FOUR_HOURS;
        const timeRemaining = nextWindowStartMs - now;
        const hours = Math.max(0, Math.floor(timeRemaining / (60 * 60 * 1000)));
        const minutes = Math.max(0, Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000)));
        const seconds = Math.max(0, Math.floor((timeRemaining % (60 * 1000)) / 1000));

        // Advance the stored window start so UI shows correct cooldown going forward.
        await updateDoc(userProductRef, {
          earnWindowStartAt: new Date(nextWindowStartMs),
          earnLastMissedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        throw new Error(`You missed the 3-hour earning window. Next opportunity in ${hours}h ${minutes}m ${seconds}s`);
      }

      // Get wallet
      const walletRef = doc(db, 'wallets', user.id);
      const walletDoc = await getDoc(walletRef);
      
      if (!walletDoc.exists()) {
        throw new Error('Wallet not found');
      }

      const walletData = walletDoc.data();

      // Update wallet - add to balance wallet and total earnings
      await updateDoc(walletRef, {
        balanceWallet: increment(earnAmount),
        totalEarnings: increment(earnAmount),
        incomeToday: increment(earnAmount),
        updatedAt: serverTimestamp(),
      });

      // After a successful earn, move the next earning window to the next cycle.
      const nextWindowStartMs = windowStartMs + TWENTY_FOUR_HOURS;

      // Update user product - update window schedule and totalEarnings
      await updateDoc(userProductRef, {
        earnWindowStartAt: new Date(nextWindowStartMs),
        lastEarnAttempt: serverTimestamp(), // legacy audit only
        lastEarnClaimAt: serverTimestamp(),
        totalEarnings: increment(earnAmount),
        updatedAt: serverTimestamp(),
      });

      // Create transaction record
      await addDoc(collection(db, 'transactions'), {
        userId: user.id,
        type: 'earn',
        amount: earnAmount,
        status: 'completed',
        userProductId: userProductId,
        productName: userProduct.productName,
        transactionId: 'EARN_' + Date.now(),
        createdAt: serverTimestamp(),
      });

      return {
        success: true,
        data: {
          amount: earnAmount,
          message: `Successfully earned ${earnAmount}`,
        },
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to earn from product');
    }
  },
};

// Admin API
export const adminAPI = {
  // Get all members (consumers)
  getAllMembers: async (token) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'consumer'));
      const querySnapshot = await getDocs(q);

      const members = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        success: true,
        data: { members },
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch members');
    }
  },

  // Activate/Deactivate member
  toggleMemberStatus: async (token, memberId, isActive) => {
    try {
      const userRef = doc(db, 'users', memberId);
      await updateDoc(userRef, {
        isActive,
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        data: { id: memberId, isActive },
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to update member status');
    }
  },

  // Get all transactions
  getAllTransactions: async (token, limit = 100) => {
    try {
      const transactionsRef = collection(db, 'transactions');
      const q = query(transactionsRef);
      const querySnapshot = await getDocs(q);

      let transactions = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort by createdAt descending (most recent first)
      transactions.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });

      // Limit results
      transactions = transactions.slice(0, limit);

      // Fetch user names for each transaction
      const transactionsWithUsers = await Promise.all(
        transactions.map(async (transaction) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', transaction.userId));
            const userData = userDoc.exists() ? userDoc.data() : null;
            return {
              ...transaction,
              userName: userData?.name || 'Unknown',
              userPhone: userData?.phone || 'Unknown',
            };
          } catch {
            return {
              ...transaction,
              userName: 'Unknown',
              userPhone: 'Unknown',
            };
          }
        })
      );

      return {
        success: true,
        data: { transactions: transactionsWithUsers },
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch transactions');
    }
  },

  // Get all withdrawals
  getAllWithdrawals: async (token) => {
    try {
      const transactionsRef = collection(db, 'transactions');
      const q = query(transactionsRef, where('type', '==', 'withdraw'));
      const querySnapshot = await getDocs(q);

      let withdrawals = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort by createdAt descending
      withdrawals.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });

      // Fetch user names for each withdrawal
      const withdrawalsWithUsers = await Promise.all(
        withdrawals.map(async (withdrawal) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', withdrawal.userId));
            const userData = userDoc.exists() ? userDoc.data() : null;
            return {
              ...withdrawal,
              userName: userData?.name || 'Unknown',
              userPhone: userData?.phone || 'Unknown',
            };
          } catch {
            return {
              ...withdrawal,
              userName: 'Unknown',
              userPhone: 'Unknown',
            };
          }
        })
      );

      return {
        success: true,
        data: { withdrawals: withdrawalsWithUsers },
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch withdrawals');
    }
  },

  // Approve/Reject withdrawal
  updateWithdrawalStatus: async (token, withdrawalId, status, adminNote = '') => {
    try {
      const transactionRef = doc(db, 'transactions', withdrawalId);
      const transactionDoc = await getDoc(transactionRef);

      if (!transactionDoc.exists()) {
        throw new Error('Withdrawal not found');
      }

      const transactionData = transactionDoc.data();

      // If rejecting, refund the amount to user's wallet and decrease totalWithdrawals
      if (status === 'rejected' && transactionData.status === 'pending') {
        const walletRef = doc(db, 'wallets', transactionData.userId);
        const walletDoc = await getDoc(walletRef);

        if (walletDoc.exists()) {
          await updateDoc(walletRef, {
            balanceWallet: increment(transactionData.amount),
            totalWithdrawals: increment(-transactionData.amount),
            updatedAt: serverTimestamp(),
          });
        }
      }

      // If approving, ensure the withdrawal was pending
      if (status === 'approved' && transactionData.status === 'pending') {
        // Balance already deducted during withdrawal creation
      }

      // Update transaction status
      await updateDoc(transactionRef, {
        status,
        adminNote,
        processedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        data: { id: withdrawalId, status },
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to update withdrawal status');
    }
  },

  // Get all pending recharge requests
  getAllPendingRecharges: async (token) => {
    try {
      const transactionsRef = collection(db, 'transactions');
      const q = query(transactionsRef, where('type', '==', 'recharge'), where('status', '==', 'pending'));
      const querySnapshot = await getDocs(q);

      let recharges = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort by createdAt descending
      recharges.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });

      // Fetch user names for each recharge
      const rechargesWithUsers = await Promise.all(
        recharges.map(async (recharge) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', recharge.userId));
            const userData = userDoc.exists() ? userDoc.data() : null;
            return {
              ...recharge,
              userName: userData?.name || 'Unknown',
              userPhone: userData?.phone || 'Unknown',
            };
          } catch {
            return {
              ...recharge,
              userName: 'Unknown',
              userPhone: 'Unknown',
            };
          }
        })
      );

      return {
        success: true,
        data: { recharges: rechargesWithUsers },
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch pending recharges');
    }
  },

  // Approve/Reject recharge request
  updateRechargeStatus: async (token, rechargeId, status, adminNote = '') => {
    try {
      const transactionRef = doc(db, 'transactions', rechargeId);
      const transactionDoc = await getDoc(transactionRef);

      if (!transactionDoc.exists()) {
        throw new Error('Recharge request not found');
      }

      const transactionData = transactionDoc.data();

      if (transactionData.type !== 'recharge') {
        throw new Error('Transaction is not a recharge');
      }

      // If approving, add amount to user's rechargeWallet
      if (status === 'approved' && transactionData.status === 'pending') {
        const walletRef = doc(db, 'wallets', transactionData.userId);
        const walletDoc = await getDoc(walletRef);

        // Ensure amount is a number
        const amountToAdd = typeof transactionData.amount === 'number' 
          ? transactionData.amount 
          : parseFloat(transactionData.amount) || 0;

        if (isNaN(amountToAdd) || amountToAdd <= 0) {
          throw new Error('Invalid recharge amount: ' + transactionData.amount);
        }

        if (walletDoc.exists()) {
          // Use increment to ensure atomic operation
          // Add to both rechargeWallet (for purchases) and balanceWallet (main wallet)
          await updateDoc(walletRef, {
            rechargeWallet: increment(amountToAdd),
            balanceWallet: increment(amountToAdd),
            updatedAt: serverTimestamp(),
          });
        } else {
          // Create wallet if it doesn't exist
          await setDoc(walletRef, {
            userId: transactionData.userId,
            rechargeWallet: amountToAdd,
            balanceWallet: amountToAdd, // Add to main wallet as well
            totalEarnings: 0,
            totalWithdrawals: 0,
            incomeToday: 0,
            incomeYesterday: 0,
            lossToday: 0,
            lossTotal: 0,
            updatedAt: serverTimestamp(),
          });
        }
      }

      // Update transaction status
      await updateDoc(transactionRef, {
        status,
        adminNote,
        processedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        data: { id: rechargeId, status },
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to update recharge status');
    }
  },
};

// VIP API
export const vipAPI = {
  // Get VIP status and rewards info
  getVIPStatus: async (token) => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User not found');

      const user = JSON.parse(userStr);
      const userDoc = await getDoc(doc(db, 'users', user.id));

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const referralCount = userData.totalReferrals || 0;
      const storedVIPLevel = userData.vipLevel || 0;
      const lastWeeklyReward = userData.lastWeeklyReward;
      const lastMonthlyReward = userData.lastMonthlyReward;

      // Calculate VIP level based on current referrals using the service function
      const { calculateVIPLevel, VIP_REWARDS, getVIPLevelName, updateVIPLevel } = await import('./vipService');
      const calculatedVIPLevel = calculateVIPLevel(referralCount);

      // Sync VIP level with database if it differs (e.g., if referral count was updated manually)
      if (calculatedVIPLevel !== storedVIPLevel) {
        try {
          await updateVIPLevel(user.id);
        } catch (syncError) {
          console.error('Error syncing VIP level:', syncError);
          // Continue even if sync fails
        }
      }

      // Get VIP rewards info
      const weeklyReward = VIP_REWARDS[calculatedVIPLevel]?.weekly || 0;
      const monthlyReward = VIP_REWARDS[calculatedVIPLevel]?.monthly || 0;

      // Calculate next reward dates
      let nextWeeklyReward = null;
      let nextMonthlyReward = null;

      if (lastWeeklyReward && calculatedVIPLevel > 0) {
        const lastRewardDate = lastWeeklyReward.toMillis
          ? new Date(lastWeeklyReward.toMillis())
          : new Date(lastWeeklyReward);
        nextWeeklyReward = new Date(lastRewardDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      }

      if (lastMonthlyReward && calculatedVIPLevel === 2) {
        const lastRewardDate = lastMonthlyReward.toMillis
          ? new Date(lastMonthlyReward.toMillis())
          : new Date(lastMonthlyReward);
        nextMonthlyReward = new Date(lastRewardDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      return {
        success: true,
        data: {
          vipLevel: calculatedVIPLevel,
          vipLevelName: getVIPLevelName(calculatedVIPLevel),
          referralCount,
          weeklyReward,
          monthlyReward,
          lastWeeklyReward: lastWeeklyReward ? (lastWeeklyReward.toMillis ? new Date(lastWeeklyReward.toMillis()) : new Date(lastWeeklyReward)) : null,
          lastMonthlyReward: lastMonthlyReward ? (lastMonthlyReward.toMillis ? new Date(lastMonthlyReward.toMillis()) : new Date(lastMonthlyReward)) : null,
          nextWeeklyReward,
          nextMonthlyReward,
        },
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch VIP status');
    }
  },

  // Check and claim VIP rewards
  claimVIPRewards: async (token) => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User not found');

      const user = JSON.parse(userStr);
      const { checkAndDistributeVIPRewards } = await import('./vipService');
      const results = await checkAndDistributeVIPRewards(user.id);

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to claim VIP rewards');
    }
  },
};

// Settings API
export const settingsAPI = {
  // Get settings
  getSettings: async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'app'));
      
      // Default customer support number
      const DEFAULT_SUPPORT_NUMBER = '+601121222669';
      
      if (!settingsDoc.exists()) {
        // Return default settings
        return {
          success: true,
          data: {
            bKashNumber: '',
            bikashQRCodeId: '',
            totalSystemCurrency: 0,
            currency: 'USD',
            referralBonus: 200,
            supportNumber: DEFAULT_SUPPORT_NUMBER,
          },
        };
      }

      const data = settingsDoc.data();
      return {
        success: true,
        data: {
          ...data,
          // Use default support number if not set in DB
          supportNumber: data.supportNumber || DEFAULT_SUPPORT_NUMBER,
        },
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch settings');
    }
  },

  // Update settings (admin only)
  updateSettings: async (token, settings) => {
    try {
      await setDoc(doc(db, 'settings', 'app'), {
        ...settings,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      return {
        success: true,
        data: settings,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to update settings');
    }
  },
};

export default {
  authAPI,
  userAPI,
  walletAPI,
  teamAPI,
  productAPI,
  adminAPI,
  settingsAPI,
  vipAPI,
};
