const Group = require('../models/Group');
const Message = require('../models/Message');
const User = require('../models/User');

exports.getGroups = async (req, res) => {
  try {
    const userId = req.user.uid;

    const groups = await Group.findByUser(userId);

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
    const userId = req.user.uid;

    // Find member users
    const members = [userId]; // Add creator
    
    if (memberEmails && memberEmails.length > 0) {
      for (const email of memberEmails) {
        const user = await User.findByEmail(email);
        if (user && !members.includes(user.id)) {
          members.push(user.id);
        }
      }
    }

    const group = await Group.create({
      name,
      creator: userId,
      members
    });

    res.status(201).json({
      success: true,
      group
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateGroupSettings = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { botMode, isMuted, name } = req.body;
    const userId = req.user.uid;

    const group = await Group.findById(groupId);

    if (!group || !group.members.includes(userId)) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if user is creator for certain operations
    const isGroupCreator = group.creator === userId;

    const updates = {};

    if (botMode && req.user.role === 'admin') {
      updates.botMode = botMode.toLowerCase();
    }

    if (typeof isMuted !== 'undefined') {
      updates.isMuted = isMuted;
    }

    if (name && isGroupCreator) {
      updates.name = name;
    }

    const updatedGroup = await Group.update(groupId, updates);

    res.status(200).json({
      success: true,
      group: updatedGroup
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberEmails } = req.body;
    const userId = req.user.uid;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if user is creator
    const isGroupCreator = group.creator === userId;

    if (!isGroupCreator) {
      return res.status(403).json({ success: false, message: 'Only group creator can add members' });
    }

    // Find and add new members
    for (const email of memberEmails) {
      const user = await User.findByEmail(email);
      
      if (user && !group.members.includes(user.id)) {
        await Group.addMember(groupId, user.id);
      }
    }

    const updatedGroup = await Group.findById(groupId);

    res.status(200).json({
      success: true,
      group: updatedGroup
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.searchMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { query } = req.query;
    const userId = req.user.uid;

    const group = await Group.findById(groupId);

    if (!group || !group.members.includes(userId)) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Get member details
    const members = [];
    for (const memberId of group.members) {
      const user = await User.findById(memberId);
      if (user) {
        members.push(user);
      }
    }

    // Filter members by query
    const filteredMembers = members.filter(member => 
      member.displayName.toLowerCase().includes(query.toLowerCase()) ||
      member.email.toLowerCase().includes(query.toLowerCase())
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
    const { limit = 50 } = req.query;
    const userId = req.user.uid;

    // Verify user is member
    const group = await Group.findById(groupId);

    if (!group || !group.members.includes(userId)) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const allMessages = await Message.findByChatId('group', groupId, limit);
    
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
