const DirectMessage = require('../models/DirectMessage');
const Message = require('../models/Message');
const User = require('../models/User');

exports.getDirectMessages = async (req, res) => {
  try {
    const userId = req.user.uid;

    const dms = await DirectMessage.findByUser(userId);

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
    const userId = req.user.uid;

    // Find the other participant
    const otherUser = await User.findByEmail(participantEmail);
    if (!otherUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (otherUser.id === userId) {
      return res.status(400).json({ success: false, message: 'Cannot create DM with yourself' });
    }

    // Check if DM already exists
    let dm = await DirectMessage.findByParticipants(userId, otherUser.id);

    if (!dm) {
      // Create new DM
      dm = await DirectMessage.create({
        members: [userId, otherUser.id]
      });
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
    const userId = req.user.uid;

    const dm = await DirectMessage.findById(dmId);

    if (!dm || !dm.members.includes(userId)) {
      return res.status(404).json({ success: false, message: 'Direct message not found' });
    }

    const updates = {};

    // Only admin can change bot mode
    if (botMode && req.user.role === 'admin') {
      updates.botMode = botMode.toLowerCase();
    }

    if (typeof isFavorite !== 'undefined') updates.isFavorite = isFavorite;
    if (typeof isMuted !== 'undefined') updates.isMuted = isMuted;
    if (relationshipType && req.user.role === 'admin') updates.relationshipType = relationshipType;
    if (typeof privacyNoticeSeen !== 'undefined') updates.privacyNoticeSeen = privacyNoticeSeen;

    const updatedDm = await DirectMessage.update(dmId, updates);

    res.status(200).json({
      success: true,
      dm: updatedDm
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { dmId } = req.params;
    const { limit = 50 } = req.query;
    const userId = req.user.uid;

    // Verify user is participant
    const dm = await DirectMessage.findById(dmId);

    if (!dm || !dm.members.includes(userId)) {
      return res.status(404).json({ success: false, message: 'Direct message not found' });
    }

    const allMessages = await Message.findByChatId('dm', dmId, limit);
    
    // Filter out messages deleted for this user
    const messages = allMessages.filter(msg => 
      !msg.deletedForEveryone && !msg.deletedFor.includes(userId)
    );

    res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.searchMessages = async (req, res) => {
  try {
    const { dmId } = req.params;
    const { query } = req.query;
    const userId = req.user.uid;

    // Verify user is participant
    const dm = await DirectMessage.findById(dmId);

    if (!dm || !dm.members.includes(userId)) {
      return res.status(404).json({ success: false, message: 'Direct message not found' });
    }

    const allMessages = await Message.search('dm', dmId, query);
    
    // Filter out messages deleted for this user
    const messages = allMessages.filter(msg => 
      !msg.deletedForEveryone && !msg.deletedFor.includes(userId)
    );

    res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
