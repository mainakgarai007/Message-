const Request = require('../models/Request');
const User = require('../models/User');

exports.getRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await Request.find({
      to: userId,
      status: 'pending'
    })
    .populate('from', 'name email')
    .sort({ createdAt: -1 });

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
    const userId = req.user.id;

    const targetUser = await User.findOne({ email });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (targetUser._id.toString() === userId) {
      return res.status(400).json({ success: false, message: 'Cannot send friend request to yourself' });
    }

    // Check if request already exists
    const existingRequest = await Request.findOne({
      from: userId,
      to: targetUser._id,
      type: 'friend',
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ success: false, message: 'Friend request already sent' });
    }

    const request = await Request.create({
      type: 'friend',
      from: userId,
      to: targetUser._id,
      message
    });

    const populatedRequest = await Request.findById(request._id)
      .populate('from', 'name email');

    res.status(201).json({
      success: true,
      request: populatedRequest
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.handleRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // 'accept' or 'ignore'
    const userId = req.user.id;

    const request = await Request.findOne({
      _id: requestId,
      to: userId
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (action === 'accept') {
      request.status = 'accepted';
      
      // For friend requests, establish the connection
      if (request.type === 'friend' && request.from) {
        // This could be extended to add to a friends list if needed
      }
    } else if (action === 'ignore') {
      request.status = 'ignored';
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    await request.save();

    res.status(200).json({
      success: true,
      request
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendEmailRequest = async (req, res) => {
  try {
    const { fromEmail, message, toEmail } = req.body;

    const targetUser = await User.findOne({ email: toEmail });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const request = await Request.create({
      type: 'email',
      fromEmail,
      to: targetUser._id,
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

    const admin = await User.findOne({ email: adminEmail, isAdmin: true });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const request = await Request.create({
      type: 'website',
      fromEmail,
      to: admin._id,
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
