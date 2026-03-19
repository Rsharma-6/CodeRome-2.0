const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  username: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'system', 'ai'], default: 'text' },
  createdAt: { type: Date, default: Date.now },
});

messageSchema.index({ roomId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
