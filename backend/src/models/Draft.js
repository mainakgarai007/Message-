const { db } = require('../config/firebase');

/**
 * Draft Model (Firestore-based)
 * User-specific draft storage
 */

class Draft {
  /**
   * Save or update a draft
   */
  static async save(userId, chatType, chatId, content) {
    const draftId = `${userId}_${chatId}`;
    const draftRef = db.collection('drafts').doc(draftId);
    
    const data = {
      userId,
      chatType, // 'dm' or 'group'
      chatId,
      content,
      updatedAt: new Date()
    };
    
    await draftRef.set(data, { merge: true });
    return { id: draftId, ...data };
  }

  /**
   * Get draft for a user and chat
   */
  static async get(userId, chatId) {
    const draftId = `${userId}_${chatId}`;
    const draftDoc = await db.collection('drafts').doc(draftId).get();
    
    if (!draftDoc.exists) {
      return null;
    }
    return { id: draftDoc.id, ...draftDoc.data() };
  }

  /**
   * Delete draft
   */
  static async delete(userId, chatId) {
    const draftId = `${userId}_${chatId}`;
    await db.collection('drafts').doc(draftId).delete();
  }

  /**
   * Get all drafts for a user
   */
  static async findByUser(userId) {
    const snapshot = await db.collection('drafts')
      .where('userId', '==', userId)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

module.exports = Draft;
