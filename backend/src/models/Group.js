const { db } = require('../config/firebase');

/**
 * Group Model (Firestore-based)
 * All access is UID-based, members only
 * Each group has its own botMode: "on" | "manual" | "auto"
 */

class Group {
  /**
   * Create a new group
   * @param {object} groupData - Group data
   */
  static async create(groupData) {
    const groupRef = db.collection('groups').doc();
    
    const data = {
      name: groupData.name,
      creator: groupData.creator, // UID of creator
      members: groupData.members || [groupData.creator], // Array of UIDs
      botMode: groupData.botMode || 'auto', // 'on', 'manual', 'auto'
      isMuted: groupData.isMuted || false,
      lastMessageAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await groupRef.set(data);
    return { id: groupRef.id, ...data };
  }

  /**
   * Find group by ID
   */
  static async findById(groupId) {
    const groupDoc = await db.collection('groups').doc(groupId).get();
    if (!groupDoc.exists) {
      return null;
    }
    return { id: groupDoc.id, ...groupDoc.data() };
  }

  /**
   * Get all groups for a user
   */
  static async findByUser(uid) {
    const snapshot = await db.collection('groups')
      .where('members', 'array-contains', uid)
      .orderBy('lastMessageAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Update group
   */
  static async update(groupId, updates) {
    const groupRef = db.collection('groups').doc(groupId);
    updates.updatedAt = new Date();
    await groupRef.update(updates);
    return this.findById(groupId);
  }

  /**
   * Update botMode for a specific group (admin only)
   * @param {string} groupId - Group ID
   * @param {string} botMode - 'on' | 'manual' | 'auto'
   */
  static async updateBotMode(groupId, botMode) {
    const groupRef = db.collection('groups').doc(groupId);
    await groupRef.update({
      botMode: botMode.toLowerCase(),
      updatedAt: new Date()
    });
    return this.findById(groupId);
  }

  /**
   * Add member to group
   */
  static async addMember(groupId, uid) {
    const groupRef = db.collection('groups').doc(groupId);
    await groupRef.update({
      members: db.FieldValue.arrayUnion(uid),
      updatedAt: new Date()
    });
    return this.findById(groupId);
  }

  /**
   * Remove member from group
   */
  static async removeMember(groupId, uid) {
    const groupRef = db.collection('groups').doc(groupId);
    await groupRef.update({
      members: db.FieldValue.arrayRemove(uid),
      updatedAt: new Date()
    });
    return this.findById(groupId);
  }

  /**
   * Check if user is member
   */
  static async isMember(groupId, uid) {
    const group = await this.findById(groupId);
    return group && group.members.includes(uid);
  }

  /**
   * Check if user is creator
   */
  static async isCreator(groupId, uid) {
    const group = await this.findById(groupId);
    return group && group.creator === uid;
  }

  /**
   * Delete group
   */
  static async delete(groupId) {
    // Delete all messages in the group first
    const messagesSnapshot = await db.collection('groups').doc(groupId).collection('messages').get();
    const batch = db.batch();
    messagesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    
    // Delete the group
    await db.collection('groups').doc(groupId).delete();
  }

  /**
   * Get group with last message populated
   */
  static async findByIdWithLastMessage(groupId) {
    const group = await this.findById(groupId);
    if (!group) return null;
    
    // Get the last message
    const messagesSnapshot = await db.collection('groups').doc(groupId).collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    if (!messagesSnapshot.empty) {
      group.lastMessage = { id: messagesSnapshot.docs[0].id, ...messagesSnapshot.docs[0].data() };
    }
    
    return group;
  }

  /**
   * Search groups by name
   */
  static async searchByName(query) {
    const snapshot = await db.collection('groups')
      .where('name', '>=', query)
      .where('name', '<=', query + '\uf8ff')
      .limit(20)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

module.exports = Group;
