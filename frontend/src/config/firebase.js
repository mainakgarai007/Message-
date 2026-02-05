import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyB21rcKciVt49oeghifSnNuZKfHW02OYl4",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "message-5beb7.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "message-5beb7",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "message-5beb7.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "134586933560",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:134586933560:web:d8d760fa9e309d461ae1cd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
const auth = getAuth(app);
const db = getFirestore(app);

// Use emulators in development if needed
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
}

export { auth, db, app };
