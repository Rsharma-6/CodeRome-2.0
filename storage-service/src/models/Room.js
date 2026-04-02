const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true, maxlength: 60 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  problemId: { type: String, default: null },
  code: { type: String, default: '' },
  language: { type: String, default: 'python3' },
  createdAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now },
});

roomSchema.index({ createdBy: 1, lastActiveAt: -1 });

module.exports = mongoose.model('Room', roomSchema);
