const Message = require('../models/Message');
const DirectMessage = require('../models/DirectMessage');
const Group = require('../models/Group');
const Draft = require('../models/Draft');

exports.sendMessage = async (req, res) => {
  try {
    const { content, chatType, chatId, replyTo, mentionedUsers } = req.body;
    const userId = req.user.id;

    // Verify user has access to chat
    if (chatType === 'dm') {
      const dm = await DirectMessage.findOne({
        _id: chatId,
        participants: userId
      });
      if (!dm) {
        return res.status(404).json({ success: false, message: 'Direct message not found' });
      }
    } else if (chatType === 'group') {
      const group = await Group.findOne({
        _id: chatId,
        'members.user': userId
      });
      if (!group) {
        return res.status(404).json({ success: false, message: 'Group not found' });
      }
    }

    const message = await Message.create({
      sender: userId,
      content,
      chatType,
      chatId,
      replyTo: replyTo || null,
      mentionedUsers: mentionedUsers || [],
      isAutomated: false
    });

    // Update last message
    if (chatType === 'dm') {
      await DirectMessage.findByIdAndUpdate(chatId, {
        lastMessage: message._id,
        lastMessageAt: Date.now()
      });
    } else {
      await Group.findByIdAndUpdate(chatId, {
        lastMessage: message._id,
        lastMessageAt: Date.now()
      });
    }

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name replyName')
      .populate('replyTo')
      .populate('mentionedUsers', 'name replyName');

    res.status(201).json({
      success: true,
      message: populatedMessage
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Check if user is sender
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Check if within edit window (2-3 minutes)
    const timeDiff = Date.now() - new Date(message.createdAt).getTime();
    const editWindow = 3 * 60 * 1000; // 3 minutes
    
    if (timeDiff > editWindow) {
      return res.status(400).json({ success: false, message: 'Edit window expired' });
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = Date.now();
    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name replyName')
      .populate('replyTo');

    res.status(200).json({
      success: true,
      message: populatedMessage
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { forEveryone } = req.body;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Check if user is sender
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (forEveryone) {
      message.deletedForEveryone = true;
    } else {
      message.deletedFor.push(userId);
    }

    await message.save();

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
    const { emoji } = req.body;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Remove existing reaction from this user
    message.reactions = message.reactions.filter(r => 
      r.user.toString() !== userId
    );

    // Add new reaction
    message.reactions.push({ user: userId, emoji });
    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name replyName')
      .populate('reactions.user', 'name');

    res.status(200).json({
      success: true,
      message: populatedMessage
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.pinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Verify user has access to this chat
    if (message.chatType === 'dm') {
      const dm = await DirectMessage.findOne({
        _id: message.chatId,
        participants: userId
      });
      if (!dm) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    } else {
      const group = await Group.findOne({
        _id: message.chatId,
        'members.user': userId
      });
      if (!group) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    message.isPinned = !message.isPinned;
    await message.save();

    res.status(200).json({
      success: true,
      message
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.saveDraft = async (req, res) => {
  try {
    const { chatType, chatId, content } = req.body;
    const userId = req.user.id;

    let draft = await Draft.findOne({ user: userId, chatId });

    if (draft) {
      draft.content = content;
      draft.chatType = chatType;
      await draft.save();
    } else {
      draft = await Draft.create({
        user: userId,
        chatType,
        chatId,
        content
      });
    }

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
    const userId = req.user.id;

    const draft = await Draft.findOne({ user: userId, chatId });

    res.status(200).json({
      success: true,
      draft
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
