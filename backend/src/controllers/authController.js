const { auth } = require('../config/firebase');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/email');

/**
 * Auth Controller - Firebase Auth Integration
 * Users are stored in Firestore with UID as document ID
 * Admin determined by role field: users/{uid}.role === "admin"
 */

exports.register = async (req, res) => {
  try {
    const { email, password, name, replyName } = req.body;

    // Validate email
    if (!User.validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email: email.toLowerCase(),
      password,
      displayName: name,
      emailVerified: false
    });

    // Create Firestore user document with UID as document ID
    const user = await User.create(userRecord.uid, {
      email: email.toLowerCase(),
      name,
      replyName: replyName || name,
      role: 'user', // Default role
      isVerified: false
    });

    // Generate email verification link
    try {
      const verificationLink = await auth.generateEmailVerificationLink(email);
      await sendVerificationEmail(email, verificationLink);
    } catch (error) {
      console.error('Email sending failed:', error);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      userId: userRecord.uid
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    // Verify the email verification link/token using Firebase
    // This is typically handled client-side, but we'll update the user here
    
    // For now, we'll accept a UID and mark as verified
    // In production, use Firebase's email verification flow
    const { uid } = req.body;
    
    if (!uid) {
      return res.status(400).json({ success: false, message: 'User ID required' });
    }

    // Update user as verified in Firebase Auth
    await auth.updateUser(uid, { emailVerified: true });
    
    // Update Firestore user document
    await User.update(uid, { isVerified: true });

    // Generate custom token for client
    const customToken = await auth.createCustomToken(uid);

    const user = await User.findById(uid);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      token: customToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.displayName,
        replyName: user.replyName,
        isAdmin: user.role === 'admin'
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'ID token required' });
    }

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Get user from Firestore
    const user = await User.findById(uid);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Check if verified
    if (!user.isVerified) {
      return res.status(401).json({ success: false, message: 'Please verify your email before logging in' });
    }

    res.status(200).json({
      success: true,
      token: idToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.displayName,
        replyName: user.replyName,
        isAdmin: user.role === 'admin',
        isGhostMode: user.isGhostMode
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.uid);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.displayName,
        replyName: user.replyName,
        isAdmin: user.role === 'admin',
        isGhostMode: user.isGhostMode,
        following: user.following,
        followers: user.followers,
        blockedUsers: user.blockedUsers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, replyName } = req.body;
    
    const updates = {};
    if (name) {
      updates.displayName = name;
      // Also update Firebase Auth displayName
      await auth.updateUser(req.user.uid, { displayName: name });
    }
    if (replyName) updates.replyName = replyName;
    
    const user = await User.update(req.user.uid, updates);
    
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.displayName,
        replyName: user.replyName
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleGhostMode = async (req, res) => {
  try {
    // Check if user is admin
    const isAdmin = await User.isAdmin(req.user.uid);
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin only feature' });
    }

    const user = await User.findById(req.user.uid);
    const newGhostMode = !user.isGhostMode;
    
    await User.update(req.user.uid, { isGhostMode: newGhostMode });

    res.status(200).json({
      success: true,
      isGhostMode: newGhostMode
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
