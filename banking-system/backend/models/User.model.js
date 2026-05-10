const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  avatar: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  passwordChangedAt: Date,
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.passwordChangedAfter = function(iat) {
  if (this.passwordChangedAt)
    return iat < parseInt(this.passwordChangedAt.getTime() / 1000, 10);
  return false;
};

userSchema.methods.toPublic = function() {
  const obj = this.toObject();
  delete obj.password; delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
