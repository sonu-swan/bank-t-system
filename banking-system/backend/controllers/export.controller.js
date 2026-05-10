const Task = require('../models/Task.model');
const Project = require('../models/Project.model');
const { asyncHandler } = require('../middleware/error.middleware');

exports.exportTasksCSV = asyncHandler(async (req, res) => {
  const { projectId } = req.query;

  let projectFilter = {};
  if (req.user.role !== 'admin') {
    const myProjects = await Project.find({
      $or: [{ createdBy: req.user._id }, { 'members.user': req.user._id }],
    }).select('_id');
    projectFilter = { project: { $in: myProjects.map(p => p._id) } };
  }
  if (projectId) projectFilter.project = projectId;

  const tasks = await Task.find(projectFilter)
    .populate('project', 'name')
    .populate('assignee', 'name email')
    .populate('createdBy', 'name')
    .sort('-createdAt')
    .lean();

  const headers = ['ID', 'Title', 'Project', 'Status', 'Priority', 'Assignee', 'Due Date', 'Completed At', 'Created At', 'Tags'];

  const rows = tasks.map(t => [
    t._id,
    `"${(t.title || '').replace(/"/g, '""')}"`,
    `"${t.project?.name || ''}"`,
    t.status,
    t.priority,
    `"${t.assignee?.name || 'Unassigned'}"`,
    t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-IN') : '',
    t.completedAt ? new Date(t.completedAt).toLocaleDateString('en-IN') : '',
    new Date(t.createdAt).toLocaleDateString('en-IN'),
    `"${(t.tags || []).join(', ')}"`,
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="taskflow-export.csv"');
  res.send(csv);
});
