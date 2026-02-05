const DirectMessage = require('../models/DirectMessage');
const Message = require('../models/Message');
const User = require('../models/User');

exports.getDirectMessages = async (req, res) => {
  try {
    const userId = req.user.id;

    const dms = await DirectMessage.find({
      participants: userId
    })
    .populate('participants', 'name email replyName isGhostMode')
    .populate('lastMessage')
    .sort({ lastMessageAt: -1 });

    res.status(200).json({
      success: true,
      dms
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createOrGetDirectMessage = async (req, res) => {
  try {
    const { participantEmail } = req.body;
    const userId = req.user.id;

    // Find the other participant
    const otherUser = await User.findOne({ email: participantEmail });
    if (!otherUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (otherUser._id.toString() === userId) {
      return res.status(400).json({ success: false, message: 'Cannot create DM with yourself' });
    }

    // Check if DM already exists
    let dm = await DirectMessage.findOne({
      participants: { $all: [userId, otherUser._id] }
    }).populate('participants', 'name email replyName');

    if (!dm) {
      // Create new DM
      dm = await DirectMessage.create({
        participants: [userId, otherUser._id]
      });
      dm = await dm.populate('participants', 'name email replyName');
    }

    res.status(200).json({
      success: true,
      dm
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateDMSettings = async (req, res) => {
  try {
    const { dmId } = req.params;
    const { botMode, isFavorite, isMuted, relationshipType, privacyNoticeSeen } = req.body;
    const userId = req.user.id;

    const dm = await DirectMessage.findOne({
      _id: dmId,
      participants: userId
    });

    if (!dm) {
      return res.status(404).json({ success: false, message: 'Direct message not found' });
    }

    // Only admin can change bot mode
    if (botMode && req.user.isAdmin) {
      dm.botMode = botMode;
    }

    if (typeof isFavorite !== 'undefined') dm.isFavorite = isFavorite;
    if (typeof isMuted !== 'undefined') dm.isMuted = isMuted;
    if (relationshipType && req.user.isAdmin) dm.relationshipType = relationshipType;
    if (typeof privacyNoticeSeen !== 'undefined') dm.privacyNoticeSeen = privacyNoticeSeen;

    await dm.save();

    res.status(200).json({
      success: true,
      dm
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { dmId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.id;

    // Verify user is participant
    const dm = await DirectMessage.findOne({
      _id: dmId,
      participants: userId
    });

    if (!dm) {
      return res.status(404).json({ success: false, message: 'Direct message not found' });
    }

    const messages = await Message.find({
      chatType: 'dm',
      chatId: dmId,
      deletedForEveryone: false,
      deletedFor: { $ne: userId }
    })
    .populate('sender', 'name replyName')
    .populate('replyTo')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Message.countDocuments({
      chatType: 'dm',
      chatId: dmId,
      deletedForEveryone: false,
      deletedFor: { $ne: userId }
    });

    res.status(200).json({
      success: true,
      messages: messages.reverse(),
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.searchMessages = async (req, res) => {
  try {
    const { dmId } = req.params;
    const { query } = req.query;
    const userId = req.user.id;

    // Verify user is participant
    const dm = await DirectMessage.findOne({
      _id: dmId,
      participants: userId
    });

    if (!dm) {
      return res.status(404).json({ success: false, message: 'Direct message not found' });
    }

    const messages = await Message.find({
      chatType: 'dm',
      chatId: dmId,
      content: { $regex: query, $options: 'i' },
      deletedForEveryone: false,
      deletedFor: { $ne: userId }
    })
    .populate('sender', 'name replyName')
    .sort({ createdAt: -1 })
    .limit(50);

    res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
