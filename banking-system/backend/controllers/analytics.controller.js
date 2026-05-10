const mongoose = require('mongoose');
const Task = require('../models/Task.model');
const Project = require('../models/Project.model');
const User = require('../models/User.model');
const { asyncHandler } = require('../middleware/error.middleware');

exports.getOverview = asyncHandler(async (req, res) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  // Scope for non-admin
  let projectIds = null;
  if (req.user.role !== 'admin') {
    const myProjects = await Project.find({
      $or: [{ createdBy: req.user._id }, { 'members.user': req.user._id }],
    }).select('_id');
    projectIds = myProjects.map(p => p._id);
  }
  const taskScope = projectIds ? { project: { $in: projectIds } } : {};

  const [
    totalTasks, doneTasks, overdueTasks,
    byPriority, byStatus,
    completedLast30, completedByDay,
    topAssignees, projectHealth,
    createdLast7, completedLast7,
  ] = await Promise.all([
    Task.countDocuments(taskScope),
    Task.countDocuments({ ...taskScope, status: 'done' }),
    Task.countDocuments({ ...taskScope, status: { $ne: 'done' }, dueDate: { $lt: now } }),

    Task.aggregate([
      { $match: taskScope },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),

    Task.aggregate([
      { $match: taskScope },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    Task.countDocuments({ ...taskScope, status: 'done', completedAt: { $gte: thirtyDaysAgo } }),

    // Completed per day last 14 days
    Task.aggregate([
      { $match: { ...taskScope, status: 'done', completedAt: { $gte: new Date(now - 14 * 86400000) } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
        count: { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]),

    // Top assignees by completed tasks
    Task.aggregate([
      { $match: { ...taskScope, status: 'done', assignee: { $ne: null } } },
      { $group: { _id: '$assignee', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: '$user.name', count: 1 } },
    ]),

    // Project health
    Task.aggregate([
      { $match: taskScope },
      { $group: {
        _id: '$project',
        total: { $sum: 1 },
        done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
        overdue: { $sum: { $cond: [{ $and: [{ $ne: ['$status', 'done'] }, { $lt: ['$dueDate', now] }] }, 1, 0] } },
      }},
      { $lookup: { from: 'projects', localField: '_id', foreignField: '_id', as: 'project' } },
      { $unwind: { path: '$project', preserveNullAndEmpty: true } },
      { $project: { name: '$project.name', color: '$project.color', total: 1, done: 1, overdue: 1 } },
      { $sort: { total: -1 } },
      { $limit: 8 },
    ]),

    Task.countDocuments({ ...taskScope, createdAt: { $gte: sevenDaysAgo } }),
    Task.countDocuments({ ...taskScope, status: 'done', completedAt: { $gte: sevenDaysAgo } }),
  ]);

  const completionRate = totalTasks > 0 ? Math.round(doneTasks / totalTasks * 100) : 0;

  res.json({
    success: true,
    data: {
      summary: { totalTasks, doneTasks, overdueTasks, completionRate, completedLast30, createdLast7, completedLast7 },
      byPriority: Object.fromEntries(byPriority.map(b => [b._id, b.count])),
      byStatus: Object.fromEntries(byStatus.map(b => [b._id, b.count])),
      completedByDay,
      topAssignees,
      projectHealth,
    },
  });
});
