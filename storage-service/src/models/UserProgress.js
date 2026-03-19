const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  solvedProblems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],
  submissionCount: { type: Number, default: 0 },
  acceptedCount: { type: Number, default: 0 },
  easyCount: { type: Number, default: 0 },
  mediumCount: { type: Number, default: 0 },
  hardCount: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
});

module.exports = mongoose.model('UserProgress', userProgressSchema);
