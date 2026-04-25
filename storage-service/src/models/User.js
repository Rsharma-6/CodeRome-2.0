const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  refreshTokens: [{ type: String }],
  isAdmin: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  profile: {
    avatar: { type: String, default: '' },
    bio: { type: String, default: '' },
    github: { type: String, default: '' },
  },
  createdAt: { type: Date, default: Date.now },
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = async function (password) {
  return bcrypt.hash(password, 12);
};

userSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    username: this.username,
    email: this.email,
    isAdmin: this.isAdmin,
    isBanned: this.isBanned,
    profile: this.profile,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
