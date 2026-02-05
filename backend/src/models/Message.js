const { db } = require('../config/firebase');

/**
 * Message Model (Firestore-based)
 * Messages are stored as subcollections under dms/{dmId}/messages or groups/{groupId}/messages
 */

class Message {
  /**
   * Create a new message
   * @param {string} chatType - 'dm' or 'group'
   * @param {string} chatId - DM or Group ID
   * @param {object} messageData - Message data
   */
  static async create(chatType, chatId, messageData) {
    const collection = chatType === 'dm' ? 'dms' : 'groups';
    const messageRef = db.collection(collection).doc(chatId).collection('messages').doc();
    
    const data = {
      senderId: messageData.senderId, // UID of sender
      content: messageData.content,
      chatType: chatType,
      chatId: chatId,
      isAutomated: messageData.isAutomated || false,
      label: messageData.label || null,
      replyTo: messageData.replyTo || null,
      reactions: messageData.reactions || [],
      isPinned: messageData.isPinned || false,
      isEdited: messageData.isEdited || false,
      editedAt: messageData.editedAt || null,
      deletedFor: messageData.deletedFor || [],
      deletedForEveryone: messageData.deletedForEveryone || false,
      expiresAt: messageData.expiresAt || null,
      mentionedUsers: messageData.mentionedUsers || [],
      createdAt: new Date()
    };
    
    await messageRef.set(data);
    
    // Update lastMessageAt on the chat
    await db.collection(collection).doc(chatId).update({
      lastMessageAt: new Date()
    });
    
    return { id: messageRef.id, ...data };
  }

  /**
   * Get message by ID
   */
  static async findById(chatType, chatId, messageId) {
    const collection = chatType === 'dm' ? 'dms' : 'groups';
    const messageDoc = await db.collection(collection).doc(chatId).collection('messages').doc(messageId).get();
    
    if (!messageDoc.exists) {
      return null;
    }
    return { id: messageDoc.id, ...messageDoc.data() };
  }

  /**
   * Get messages for a chat
   */
  static async findByChatId(chatType, chatId, limit = 50) {
    const collection = chatType === 'dm' ? 'dms' : 'groups';
    const snapshot = await db.collection(collection).doc(chatId).collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
  }

  /**
   * Update message
   */
  static async update(chatType, chatId, messageId, updates) {
    const collection = chatType === 'dm' ? 'dms' : 'groups';
    const messageRef = db.collection(collection).doc(chatId).collection('messages').doc(messageId);
    
    if (updates.content) {
      updates.isEdited = true;
      updates.editedAt = new Date();
    }
    
    await messageRef.update(updates);
    return this.findById(chatType, chatId, messageId);
  }

  /**
   * Delete message
   */
  static async delete(chatType, chatId, messageId) {
    const collection = chatType === 'dm' ? 'dms' : 'groups';
    await db.collection(collection).doc(chatId).collection('messages').doc(messageId).delete();
  }

  /**
   * Delete message for specific user
   */
  static async deleteForUser(chatType, chatId, messageId, userId) {
    const collection = chatType === 'dm' ? 'dms' : 'groups';
    const messageRef = db.collection(collection).doc(chatId).collection('messages').doc(messageId);
    
    await messageRef.update({
      deletedFor: db.FieldValue.arrayUnion(userId)
    });
  }

  /**
   * Delete message for everyone
   */
  static async deleteForEveryone(chatType, chatId, messageId) {
    const collection = chatType === 'dm' ? 'dms' : 'groups';
    const messageRef = db.collection(collection).doc(chatId).collection('messages').doc(messageId);
    
    await messageRef.update({
      deletedForEveryone: true
    });
  }

  /**
   * Add reaction to message
   */
  static async addReaction(chatType, chatId, messageId, userId, emoji) {
    const collection = chatType === 'dm' ? 'dms' : 'groups';
    const messageRef = db.collection(collection).doc(chatId).collection('messages').doc(messageId);
    const message = await this.findById(chatType, chatId, messageId);
    
    if (!message) return null;
    
    // Remove existing reaction from this user
    const reactions = message.reactions.filter(r => r.userId !== userId);
    // Add new reaction
    reactions.push({ userId, emoji });
    
    await messageRef.update({ reactions });
    return this.findById(chatType, chatId, messageId);
  }

  /**
   * Remove reaction from message
   */
  static async removeReaction(chatType, chatId, messageId, userId) {
    const collection = chatType === 'dm' ? 'dms' : 'groups';
    const messageRef = db.collection(collection).doc(chatId).collection('messages').doc(messageId);
    const message = await this.findById(chatType, chatId, messageId);
    
    if (!message) return null;
    
    const reactions = message.reactions.filter(r => r.userId !== userId);
    await messageRef.update({ reactions });
    return this.findById(chatType, chatId, messageId);
  }

  /**
   * Pin/unpin message
   */
  static async togglePin(chatType, chatId, messageId) {
    const message = await this.findById(chatType, chatId, messageId);
    if (!message) return null;
    
    const collection = chatType === 'dm' ? 'dms' : 'groups';
    const messageRef = db.collection(collection).doc(chatId).collection('messages').doc(messageId);
    
    await messageRef.update({ isPinned: !message.isPinned });
    return this.findById(chatType, chatId, messageId);
  }

  /**
   * Search messages in a chat
   * Note: This implementation is limited to 100 recent messages.
   * For production, consider using a dedicated full-text search solution
   * like Algolia, Elasticsearch, or Firebase Extensions.
   * @param {string} chatType - 'dm' or 'group'
   * @param {string} chatId - Chat ID
   * @param {string} query - Search query
   * @returns {Promise<Array>} Matching messages (max 100)
   */
  static async search(chatType, chatId, query) {
    const collection = chatType === 'dm' ? 'dms' : 'groups';
    // Note: Firestore doesn't support full-text search natively
    // This is a simple implementation - consider using Algolia or similar for production
    const snapshot = await db.collection(collection).doc(chatId).collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
    
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return messages.filter(msg => 
      msg.content.toLowerCase().includes(query.toLowerCase())
    );
  }
}

module.exports = Message;
