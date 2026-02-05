const { db } = require('../config/firebase');

/**
 * DirectMessage Model (Firestore-based)
 * All access is UID-based, members only
 * Each DM has its own botMode: "on" | "manual" | "auto"
 */

class DirectMessage {
  /**
   * Create a new DM
   * @param {object} dmData - DM data
   */
  static async create(dmData) {
    const dmRef = db.collection('dms').doc();
    
    const data = {
      members: dmData.members, // Array of UIDs
      type: dmData.type || 'personal', // 'support', 'owner', 'personal'
      botMode: dmData.botMode || 'auto', // 'on', 'manual', 'auto'
      isFavorite: dmData.isFavorite || false,
      isMuted: dmData.isMuted || false,
      relationshipType: dmData.relationshipType || 'unknown',
      lastMessageAt: new Date(),
      privacyNoticeSeen: dmData.privacyNoticeSeen || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await dmRef.set(data);
    return { id: dmRef.id, ...data };
  }

  /**
   * Find DM by ID
   */
  static async findById(dmId) {
    const dmDoc = await db.collection('dms').doc(dmId).get();
    if (!dmDoc.exists) {
      return null;
    }
    return { id: dmDoc.id, ...dmDoc.data() };
  }

  /**
   * Find DM between two users
   */
  static async findByParticipants(uid1, uid2) {
    const snapshot = await db.collection('dms')
      .where('members', 'array-contains', uid1)
      .get();
    
    const dm = snapshot.docs.find(doc => {
      const members = doc.data().members;
      return members.includes(uid2);
    });
    
    return dm ? { id: dm.id, ...dm.data() } : null;
  }

  /**
   * Get all DMs for a user
   */
  static async findByUser(uid) {
    const snapshot = await db.collection('dms')
      .where('members', 'array-contains', uid)
      .orderBy('lastMessageAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Update DM
   */
  static async update(dmId, updates) {
    const dmRef = db.collection('dms').doc(dmId);
    updates.updatedAt = new Date();
    await dmRef.update(updates);
    return this.findById(dmId);
  }

  /**
   * Update botMode for a specific DM (admin only)
   * @param {string} dmId - DM ID
   * @param {string} botMode - 'on' | 'manual' | 'auto'
   */
  static async updateBotMode(dmId, botMode) {
    const dmRef = db.collection('dms').doc(dmId);
    await dmRef.update({
      botMode: botMode.toLowerCase(),
      updatedAt: new Date()
    });
    return this.findById(dmId);
  }

  /**
   * Delete DM
   */
  static async delete(dmId) {
    // Delete all messages in the DM first
    const messagesSnapshot = await db.collection('dms').doc(dmId).collection('messages').get();
    const batch = db.batch();
    messagesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    
    // Delete the DM
    await db.collection('dms').doc(dmId).delete();
  }

  /**
   * Get DM with last message populated
   */
  static async findByIdWithLastMessage(dmId) {
    const dm = await this.findById(dmId);
    if (!dm) return null;
    
    // Get the last message
    const messagesSnapshot = await db.collection('dms').doc(dmId).collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    if (!messagesSnapshot.empty) {
      dm.lastMessage = { id: messagesSnapshot.docs[0].id, ...messagesSnapshot.docs[0].data() };
    }
    
    return dm;
  }
}

module.exports = DirectMessage;
