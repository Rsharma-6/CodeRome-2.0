const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: { type: String, default: '' },
  expectedOutput: { type: String, required: true },
  isHidden: { type: Boolean, default: false },
});

const codeStubSchema = new mongoose.Schema({
  language: { type: String, required: true },
  starterCode: { type: String, default: '' },
  driverCode: { type: String, default: '' },
});

const problemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true }, // Markdown
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  tags: [{ type: String }],
  testCases: [testCaseSchema],
  codeStubs: [codeStubSchema],
  editorial: { type: String, default: '' },
  isAIGenerated: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now },
});

problemSchema.index({ difficulty: 1, tags: 1 });

module.exports =
  mongoose.models.Problem || mongoose.model('Problem', problemSchema);