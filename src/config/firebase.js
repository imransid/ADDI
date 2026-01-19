import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration - Replace with your Firebase project config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBQ5JeGI0vdJvICTLhyraRsa9x19sF-CWM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hackchackpack.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hackchackpack",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hackchackpack.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1074792242415",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1074792242415:web:5ab3a24d2ea75ba55e4f1a"
};

// const firebaseConfig = {
//   apiKey: "AIzaSyBQ5JeGI0vdJvICTLhyraRsa9x19sF-CWM",
//   authDomain: "hackchackpack.firebaseapp.com",
//   projectId: "hackchackpack",
//   storageBucket: "hackchackpack.firebasestorage.app",
//   messagingSenderId: "1074792242415",
//   appId: "1:1074792242415:web:5ab3a24d2ea75ba55e4f1a",
//   measurementId: "G-PDKFEQFQR9"
// };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth (for future use)
export const auth = getAuth(app);

export default app;
