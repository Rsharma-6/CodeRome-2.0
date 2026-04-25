const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  input: String,
  expectedOutput: String,
  actualOutput: String,
  passed: Boolean,
  error: String,
  time: Number,
});

const submissionSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  code: { type: String, required: true },
  language: { type: String, required: true },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'WRONG_ANSWER', 'TLE', 'RE', 'MLE', 'CE'],
    default: 'PENDING',
  },
  results: [testResultSchema],
  submittedAt: { type: Date, default: Date.now },
});

submissionSchema.index({ userId: 1, problemId: 1 });
submissionSchema.index({ roomId: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
