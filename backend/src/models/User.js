const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');
const validator = require('validator');

/**
 * User Model (Firestore-based)
 * Document ID = Firebase Auth UID
 * Admin determined by: users/{uid}.role === "admin"
 */

class User {
  /**
   * Create a new user in Firestore
   * @param {string} uid - Firebase Auth UID (used as document ID)
   * @param {object} userData - User data
   */
  static async create(uid, userData) {
    const userRef = db.collection('users').doc(uid);
    
    const data = {
      email: userData.email,
      displayName: userData.name || userData.displayName,
      replyName: userData.replyName || userData.name || userData.displayName,
      role: userData.role || 'user', // 'admin' or 'user'
      userType: userData.userType || 'personal',
      isVerified: userData.isVerified || false,
      isGhostMode: userData.isGhostMode || false,
      following: userData.following || [],
      followers: userData.followers || [],
      blockedUsers: userData.blockedUsers || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await userRef.set(data);
    return { id: uid, ...data };
  }

  /**
   * Get user by UID
   */
  static async findById(uid) {
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return null;
    }
    return { id: userDoc.id, ...userDoc.data() };
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const snapshot = await db.collection('users')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  /**
   * Update user data
   */
  static async update(uid, updates) {
    const userRef = db.collection('users').doc(uid);
    updates.updatedAt = new Date();
    await userRef.update(updates);
    return this.findById(uid);
  }

  /**
   * Delete user
   */
  static async delete(uid) {
    await db.collection('users').doc(uid).delete();
  }

  /**
   * Check if user is admin
   * @param {string} uid - User UID
   * @returns {boolean}
   */
  static async isAdmin(uid) {
    const user = await this.findById(uid);
    return user && user.role === 'admin';
  }

  /**
   * Search users by email or name
   */
  static async search(query) {
    const snapshot = await db.collection('users')
      .where('email', '>=', query.toLowerCase())
      .where('email', '<=', query.toLowerCase() + '\uf8ff')
      .limit(20)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Hash password (utility function)
   */
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  /**
   * Compare password (utility function)
   */
  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Validate email
   */
  static validateEmail(email) {
    return validator.isEmail(email);
  }
}

module.exports = User;
