const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'task_assigned',
      'task_status_changed',
      'task_overdue',
      'comment_added',
      'project_added',
      'project_member_added',
      'role_changed',
    ],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: '' }, // frontend route to navigate to
  read: { type: Boolean, default: false },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // who triggered this
  entityId: String, // task/project id for linking
}, { timestamps: true });

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
