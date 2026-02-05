const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// In production, use service account key
// For now, we'll use the config from environment
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyB21rcKciVt49oeghifSnNuZKfHW02OYl4",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "message-5beb7.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "message-5beb7",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "message-5beb7.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "134586933560",
  appId: process.env.FIREBASE_APP_ID || "1:134586933560:web:d8d760fa9e309d461ae1cd"
};

// Initialize Admin SDK
if (!admin.apps.length) {
  // In production, use service account
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: firebaseConfig.projectId
    });
  } else {
    // For development, use default credentials
    admin.initializeApp({
      projectId: firebaseConfig.projectId
    });
  }
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = {
  admin,
  db,
  auth,
  firebaseConfig
};
