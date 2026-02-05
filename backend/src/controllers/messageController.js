const Message = require('../models/Message');
const DirectMessage = require('../models/DirectMessage');
const Group = require('../models/Group');
const Draft = require('../models/Draft');

exports.sendMessage = async (req, res) => {
  try {
    const { content, chatType, chatId, replyTo, mentionedUsers } = req.body;
    const userId = req.user.uid;

    // Verify user has access to chat
    if (chatType === 'dm') {
      const dm = await DirectMessage.findById(chatId);
      if (!dm || !dm.members.includes(userId)) {
        return res.status(404).json({ success: false, message: 'Direct message not found' });
      }
    } else if (chatType === 'group') {
      const group = await Group.findById(chatId);
      if (!group || !group.members.includes(userId)) {
        return res.status(404).json({ success: false, message: 'Group not found' });
      }
    }

    const message = await Message.create(chatType, chatId, {
      senderId: userId,
      content,
      replyTo: replyTo || null,
      mentionedUsers: mentionedUsers || [],
      isAutomated: false
    });

    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content, chatType, chatId } = req.body;
    const userId = req.user.uid;

    const message = await Message.findById(chatType, chatId, messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Check if user is sender
    if (message.senderId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Check if within edit window (2-3 minutes)
    const timeDiff = Date.now() - new Date(message.createdAt).getTime();
    const editWindow = 3 * 60 * 1000; // 3 minutes
    
    if (timeDiff > editWindow) {
      return res.status(400).json({ success: false, message: 'Edit window expired' });
    }

    const updatedMessage = await Message.update(chatType, chatId, messageId, { content });

    res.status(200).json({
      success: true,
      message: updatedMessage
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { forEveryone, chatType, chatId } = req.body;
    const userId = req.user.uid;

    const message = await Message.findById(chatType, chatId, messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Check if user is sender
    if (message.senderId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (forEveryone) {
      await Message.deleteForEveryone(chatType, chatId, messageId);
    } else {
      await Message.deleteForUser(chatType, chatId, messageId, userId);
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji, chatType, chatId } = req.body;
    const userId = req.user.uid;

    const message = await Message.findById(chatType, chatId, messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const updatedMessage = await Message.addReaction(chatType, chatId, messageId, userId, emoji);

    res.status(200).json({
      success: true,
      message: updatedMessage
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.pinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { chatType, chatId } = req.body;
    const userId = req.user.uid;

    const message = await Message.findById(chatType, chatId, messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Verify user has access to this chat
    if (chatType === 'dm') {
      const dm = await DirectMessage.findById(chatId);
      if (!dm || !dm.members.includes(userId)) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    } else {
      const group = await Group.findById(chatId);
      if (!group || !group.members.includes(userId)) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    const updatedMessage = await Message.togglePin(chatType, chatId, messageId);

    res.status(200).json({
      success: true,
      message: updatedMessage
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.saveDraft = async (req, res) => {
  try {
    const { chatType, chatId, content } = req.body;
    const userId = req.user.uid;

    const draft = await Draft.save(userId, chatType, chatId, content);

    res.status(200).json({
      success: true,
      draft
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDraft = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.uid;

    const draft = await Draft.get(userId, chatId);

    res.status(200).json({
      success: true,
      draft
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
