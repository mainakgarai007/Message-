const mongoose = require('mongoose');

const draftSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chatType: {
    type: String,
    enum: ['dm', 'group'],
    required: true
  },
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  content: {
    type: String,
    trim: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure one draft per user per chat
draftSchema.index({ user: 1, chatId: 1 }, { unique: true });

module.exports = mongoose.model('Draft', draftSchema);
