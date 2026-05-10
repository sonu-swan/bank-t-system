const mongoose = require('mongoose');

const labelSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 30 },
  color: { type: String, default: '#58a6ff', match: [/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'] },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

labelSchema.index({ project: 1 });

module.exports = mongoose.model('Label', labelSchema);
