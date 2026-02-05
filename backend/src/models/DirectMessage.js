const mongoose = require('mongoose');

const directMessageSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  type: {
    type: String,
    enum: ['support', 'owner', 'personal'],
    default: 'personal'
  },
  botMode: {
    type: String,
    enum: ['ON', 'MANUAL', 'AUTO'],
    default: 'AUTO'
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  isMuted: {
    type: Boolean,
    default: false
  },
  relationshipType: {
    type: String,
    enum: ['close_friend', 'brother', 'sister', 'crush', 'friend', 'unknown', 'customer'],
    default: 'unknown'
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  privacyNoticeSeen: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure unique participant pairs
directMessageSchema.index({ participants: 1 }, { unique: true });

module.exports = mongoose.model('DirectMessage', directMessageSchema);
