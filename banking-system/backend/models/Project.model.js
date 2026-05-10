const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  color: { type: String, default: '#58a6ff' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['lead', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  }],
  status: { type: String, enum: ['active', 'on-hold', 'completed', 'archived'], default: 'active' },
  deadline: Date,
}, { timestamps: true });

projectSchema.index({ createdBy: 1 });
projectSchema.index({ 'members.user': 1 });

module.exports = mongoose.model('Project', projectSchema);
