const User = require('../models/User');

exports.getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    const user = await User.findOne({ email })
      .select('name email replyName');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (userId === currentUserId) {
      return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
    }

    const user = await User.findById(currentUserId);
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if already following
    if (user.following.includes(userId)) {
      return res.status(400).json({ success: false, message: 'Already following this user' });
    }

    user.following.push(userId);
    targetUser.followers.push(currentUserId);

    await user.save();
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: 'Now following user'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const user = await User.findById(currentUserId);
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.following = user.following.filter(id => id.toString() !== userId);
    targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId);

    await user.save();
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: 'Unfollowed user'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (userId === currentUserId) {
      return res.status(400).json({ success: false, message: 'Cannot block yourself' });
    }

    const user = await User.findById(currentUserId);

    if (user.blockedUsers.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User already blocked' });
    }

    user.blockedUsers.push(userId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User blocked'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const user = await User.findById(currentUserId);
    user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== userId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User unblocked'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
