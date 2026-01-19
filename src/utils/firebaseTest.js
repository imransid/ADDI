/**
 * Firebase Connection Test Utility
 * Tests Firebase connection and database access
 */

import { db } from '../config/firebase';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Test Firebase connection by reading from Firestore
 */
export const testFirebaseConnection = async () => {
  try {
    console.log('Testing Firebase connection...');
    
    // Try to read from a test collection
    const testRef = collection(db, 'users');
    const snapshot = await getDocs(testRef);
    
    console.log('✅ Firebase connection successful!');
    console.log(`Found ${snapshot.size} users in database`);
    
    return {
      success: true,
      message: 'Firebase connection successful',
      userCount: snapshot.size,
    };
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return {
      success: false,
      message: error.message,
      error: error,
    };
  }
};

/**
 * Seed admin user in Firestore
 */
export const seedAdminUser = async (adminData) => {
  const { name, phone, password, nid } = adminData || {
    name: 'Admin User',
    phone: '1234567890',
    password: 'admin123',
    nid: 'ADMIN001',
  };

  try {
    console.log('Seeding admin user...');

    // Hash password (simple base64 for demo)
    const hashedPassword = btoa(password);

    // Check if admin already exists
    const usersRef = collection(db, 'users');
    const adminDocRef = doc(usersRef, 'admin_default');

    // Set admin user
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

    console.log('✅ Admin user seeded successfully!');
    console.log('Admin credentials:');
    console.log(`  Phone: ${phone}`);
    console.log(`  Password: ${password}`);

    // Initialize wallet for admin
    await setDoc(doc(db, 'wallets', 'admin_default'), {
      userId: 'admin_default',
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

    console.log('✅ Admin wallet initialized!');

    return {
      success: true,
      message: 'Admin user seeded successfully',
      credentials: { phone, password },
    };
  } catch (error) {
    console.error('❌ Failed to seed admin user:', error);
    return {
      success: false,
      message: error.message,
      error: error,
    };
  }
};

export default {
  testFirebaseConnection,
  seedAdminUser,
};
