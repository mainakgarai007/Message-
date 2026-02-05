const { auth } = require('../config/firebase');
const User = require('../models/User');

/**
 * Auth Middleware - Firebase Auth Integration
 * Verifies Firebase ID tokens
 * Admin check: users/{uid}.role === "admin"
 */

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    // Verify Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);
    
    // Get user from Firestore
    const user = await User.findById(decodedToken.uid);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ success: false, message: 'Email not verified' });
    }

    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: user.email,
      role: user.role,
      isAdmin: user.role === 'admin'
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

/**
 * Admin-only middleware
 * Checks if user.role === "admin"
 */
exports.adminOnly = async (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
  }
  next();
};
