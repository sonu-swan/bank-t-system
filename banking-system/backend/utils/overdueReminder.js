/**
 * Overdue reminder job
 * Run with: node utils/overdueReminder.js
 * Or set up a cron: 0 8 * * * node /path/to/overdueReminder.js
 * Or call POST /api/internal/run-overdue-check (admin only)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('../models/Task.model');
const { notify } = require('./notify');

async function runOverdueCheck() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
  }

  const now = new Date();
  const overdueTasks = await Task.find({
    status: { $ne: 'done' },
    dueDate: { $lt: now },
    assignee: { $ne: null },
  }).populate('assignee', 'name').populate('project', 'name');

  console.log(`Found ${overdueTasks.length} overdue tasks`);

  for (const task of overdueTasks) {
    await notify({
      recipientId: task.assignee._id,
      type: 'task_overdue',
      title: 'Task is overdue',
      message: `"${task.title}" in ${task.project?.name || 'a project'} is past its due date`,
      link: `/tasks/${task._id}`,
      entityId: task._id.toString(),
    });
  }

  console.log('Overdue notifications sent.');
  return overdueTasks.length;
}

// Run if called directly
if (require.main === module) {
  runOverdueCheck()
    .then(count => { console.log(`Done. Notified for ${count} tasks.`); process.exit(0); })
    .catch(err => { console.error(err); process.exit(1); });
}

module.exports = { runOverdueCheck };
