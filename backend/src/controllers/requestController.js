const Request = require('../models/Request');
const User = require('../models/User');

exports.getRequests = async (req, res) => {
  try {
    const userId = req.user.uid;

    const requests = await Request.findPendingByReceiver(userId);

    res.status(200).json({
      success: true,
      requests
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendFriendRequest = async (req, res) => {
  try {
    const { email, message } = req.body;
    const userId = req.user.uid;

    const targetUser = await User.findByEmail(email);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (targetUser.id === userId) {
      return res.status(400).json({ success: false, message: 'Cannot send friend request to yourself' });
    }

    // Check if request already exists
    const existingRequests = await Request.findBySender(userId);
    const existingRequest = existingRequests.find(r => 
      r.receiverId === targetUser.id && r.type === 'friend' && r.status === 'pending'
    );

    if (existingRequest) {
      return res.status(400).json({ success: false, message: 'Friend request already sent' });
    }

    const request = await Request.create({
      type: 'friend',
      senderId: userId,
      receiverId: targetUser.id,
      message
    });

    res.status(201).json({
      success: true,
      request
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.handleRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // 'accept' or 'ignore'
    const userId = req.user.uid;

    const request = await Request.findById(requestId);

    if (!request || request.receiverId !== userId) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (action === 'accept') {
      await Request.updateStatus(requestId, 'accepted');
    } else if (action === 'ignore') {
      await Request.updateStatus(requestId, 'ignored');
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    const updatedRequest = await Request.findById(requestId);

    res.status(200).json({
      success: true,
      request: updatedRequest
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendEmailRequest = async (req, res) => {
  try {
    const { fromEmail, message, toEmail } = req.body;

    const targetUser = await User.findByEmail(toEmail);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const request = await Request.create({
      type: 'email',
      fromEmail,
      receiverId: targetUser.id,
      senderId: null,
      message
    });

    res.status(201).json({
      success: true,
      message: 'Request sent successfully',
      request
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendWebsiteRequest = async (req, res) => {
  try {
    const { fromEmail, message, adminEmail } = req.body;

    const admin = await User.findByEmail(adminEmail);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const request = await Request.create({
      type: 'website',
      fromEmail,
      receiverId: admin.id,
      senderId: null,
      message
    });

    res.status(201).json({
      success: true,
      message: 'Request sent successfully',
      request
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
