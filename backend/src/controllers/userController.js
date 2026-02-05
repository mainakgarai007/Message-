const User = require('../models/User');

exports.getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    const user = await User.findByEmail(email);

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
    const currentUserId = req.user.uid;

    if (userId === currentUserId) {
      return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
    }

    const user = await User.findById(currentUserId);
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if already following
    if (user.following && user.following.includes(userId)) {
      return res.status(400).json({ success: false, message: 'Already following this user' });
    }

    const following = user.following || [];
    following.push(userId);
    await User.update(currentUserId, { following });

    const followers = targetUser.followers || [];
    followers.push(currentUserId);
    await User.update(userId, { followers });

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
    const currentUserId = req.user.uid;

    const user = await User.findById(currentUserId);
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const following = (user.following || []).filter(id => id !== userId);
    await User.update(currentUserId, { following });

    const followers = (targetUser.followers || []).filter(id => id !== currentUserId);
    await User.update(userId, { followers });

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
    const currentUserId = req.user.uid;

    if (userId === currentUserId) {
      return res.status(400).json({ success: false, message: 'Cannot block yourself' });
    }

    const user = await User.findById(currentUserId);

    if (user.blockedUsers && user.blockedUsers.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User already blocked' });
    }

    const blockedUsers = user.blockedUsers || [];
    blockedUsers.push(userId);
    await User.update(currentUserId, { blockedUsers });

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
    const currentUserId = req.user.uid;

    const user = await User.findById(currentUserId);
    const blockedUsers = (user.blockedUsers || []).filter(id => id !== userId);
    await User.update(currentUserId, { blockedUsers });

    res.status(200).json({
      success: true,
      message: 'User unblocked'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
