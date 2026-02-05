const Group = require('../models/Group');
const Message = require('../models/Message');
const User = require('../models/User');

exports.getGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    const groups = await Group.find({
      'members.user': userId
    })
    .populate('creator', 'name email')
    .populate('members.user', 'name email replyName')
    .populate('lastMessage')
    .sort({ lastMessageAt: -1 });

    res.status(200).json({
      success: true,
      groups
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const { name, memberEmails } = req.body;
    const userId = req.user.id;

    // Find member users
    const members = [];
    if (memberEmails && memberEmails.length > 0) {
      const users = await User.find({ email: { $in: memberEmails } });
      users.forEach(user => {
        members.push({
          user: user._id,
          isAdmin: false
        });
      });
    }

    // Add creator as admin
    members.push({
      user: userId,
      isAdmin: true
    });

    const group = await Group.create({
      name,
      creator: userId,
      members
    });

    const populatedGroup = await Group.findById(group._id)
      .populate('creator', 'name email')
      .populate('members.user', 'name email replyName');

    res.status(201).json({
      success: true,
      group: populatedGroup
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateGroupSettings = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { botMode, isMuted, name } = req.body;
    const userId = req.user.id;

    const group = await Group.findOne({
      _id: groupId,
      'members.user': userId
    });

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if user is admin for certain operations
    const isGroupAdmin = group.members.some(m => 
      m.user.toString() === userId && m.isAdmin
    );

    if (botMode && req.user.isAdmin) {
      group.botMode = botMode;
    }

    if (typeof isMuted !== 'undefined') {
      group.isMuted = isMuted;
    }

    if (name && isGroupAdmin) {
      group.name = name;
    }

    await group.save();

    res.status(200).json({
      success: true,
      group
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberEmails } = req.body;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if user is admin
    const isGroupAdmin = group.members.some(m => 
      m.user.toString() === userId && m.isAdmin
    );

    if (!isGroupAdmin) {
      return res.status(403).json({ success: false, message: 'Only group admins can add members' });
    }

    // Find new members
    const users = await User.find({ email: { $in: memberEmails } });
    
    users.forEach(user => {
      const alreadyMember = group.members.some(m => 
        m.user.toString() === user._id.toString()
      );
      
      if (!alreadyMember) {
        group.members.push({
          user: user._id,
          isAdmin: false
        });
      }
    });

    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('creator', 'name email')
      .populate('members.user', 'name email replyName');

    res.status(200).json({
      success: true,
      group: populatedGroup
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.searchMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { query } = req.query;
    const userId = req.user.id;

    const group = await Group.findOne({
      _id: groupId,
      'members.user': userId
    }).populate('members.user', 'name email replyName');

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const filteredMembers = group.members.filter(member => 
      member.user.name.toLowerCase().includes(query.toLowerCase()) ||
      member.user.email.toLowerCase().includes(query.toLowerCase())
    );

    res.status(200).json({
      success: true,
      members: filteredMembers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.id;

    // Verify user is member
    const group = await Group.findOne({
      _id: groupId,
      'members.user': userId
    });

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const messages = await Message.find({
      chatType: 'group',
      chatId: groupId,
      deletedForEveryone: false,
      deletedFor: { $ne: userId }
    })
    .populate('sender', 'name replyName')
    .populate('replyTo')
    .populate('mentionedUsers', 'name replyName')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Message.countDocuments({
      chatType: 'group',
      chatId: groupId,
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
