const { db } = require('../config/firebase');

/**
 * Request Model (Firestore-based)
 * UID-based access control
 */

class Request {
  /**
   * Create a new request
   */
  static async create(requestData) {
    const requestRef = db.collection('requests').doc();
    
    const data = {
      type: requestData.type, // 'friend', 'invite', 'email', 'website'
      senderId: requestData.senderId, // UID
      receiverId: requestData.receiverId, // UID
      fromEmail: requestData.fromEmail || null,
      message: requestData.message || '',
      status: 'pending', // 'pending', 'accepted', 'ignored'
      createdAt: new Date()
    };
    
    await requestRef.set(data);
    return { id: requestRef.id, ...data };
  }

  /**
   * Find request by ID
   */
  static async findById(requestId) {
    const requestDoc = await db.collection('requests').doc(requestId).get();
    if (!requestDoc.exists) {
      return null;
    }
    return { id: requestDoc.id, ...requestDoc.data() };
  }

  /**
   * Get requests for a user (as receiver)
   */
  static async findByReceiver(uid) {
    const snapshot = await db.collection('requests')
      .where('receiverId', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Get requests sent by a user
   */
  static async findBySender(uid) {
    const snapshot = await db.collection('requests')
      .where('senderId', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Get pending requests for a user
   */
  static async findPendingByReceiver(uid) {
    const snapshot = await db.collection('requests')
      .where('receiverId', '==', uid)
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Update request status
   */
  static async updateStatus(requestId, status) {
    const requestRef = db.collection('requests').doc(requestId);
    await requestRef.update({ status });
    return this.findById(requestId);
  }

  /**
   * Delete request
   */
  static async delete(requestId) {
    await db.collection('requests').doc(requestId).delete();
  }
}

module.exports = Request;
