/**
 * Admin Seeding Service
 * Service to seed admin data into Firebase Firestore
 * Can be called from anywhere in the app
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Simple password hashing (same as in api.js)
const hashPassword = (password) => {
  return btoa(password);
};

/**
 * Test Firebase connection
 */
export const testConnection = async () => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    return {
      success: true,
      message: 'Firebase connection successful',
      userCount: snapshot.size,
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
      error: error,
    };
  }
};

/**
 * Seed admin user into Firestore
 * @param {Object} adminData - Admin user data { name, phone, password, nid }
 * @returns {Promise<Object>} Result object with success status
 */
export const seedAdminUser = async (adminData = {}) => {
  const { 
    name = 'Admin User', 
    phone = '1234567890', 
    password = 'admin123',
    nid = 'ADMIN001' 
  } = adminData;

  try {
    // Check if admin already exists by phone
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phone', '==', phone));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const existingUser = querySnapshot.docs[0];
      return {
        success: true,
        message: 'Admin user already exists',
        isNew: false,
        userId: existingUser.id,
        credentials: { phone, password },
      };
    }

    // Hash password
    const hashedPassword = hashPassword(password);

    // Create admin user document
    const adminDocRef = doc(collection(db, 'users'));
    
    await setDoc(adminDocRef, {
      name,
      phone,
      password: hashedPassword,
      nid,
      role: 'admin',
      isActive: true,
      createdAt: serverTimestamp(),
      lastLogin: null,
    });

    const userId = adminDocRef.id;

    // Initialize wallet for admin
    await setDoc(doc(db, 'wallets', userId), {
      userId,
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
      message: 'Admin user seeded successfully',
      isNew: true,
      userId,
      credentials: { phone, password },
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to seed admin: ${error.message}`,
      error: error,
    };
  }
};

/**
 * Quick seed with default admin credentials
 */
export const quickSeedAdmin = async () => {
  return await seedAdminUser({
    name: 'Admin User',
    phone: '1234567890',
    password: 'admin123',
    nid: 'ADMIN001',
  });
};

export default {
  testConnection,
  seedAdminUser,
  quickSeedAdmin,
};
