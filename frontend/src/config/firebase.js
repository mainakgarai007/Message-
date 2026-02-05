import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB21rcKciVt49oeghifSnNuZKfHW02OYl4",
  authDomain: "message-5beb7.firebaseapp.com",
  projectId: "message-5beb7",
  storageBucket: "message-5beb7.firebasestorage.app",
  messagingSenderId: "134586933560",
  appId: "1:134586933560:web:d8d760fa9e309d461ae1cd"
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
