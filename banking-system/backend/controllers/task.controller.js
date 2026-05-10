const Task = require('../models/Task.model');
const Project = require('../models/Project.model');
const { asyncHandler } = require('../middleware/error.middleware');
const { notify, notifyMany } = require('../utils/notify');

exports.getAll = asyncHandler(async (req, res) => {
  const { project, status, priority, assignee, overdue, page = 1, limit = 50 } = req.query;
  const filter = {};

  if (req.user.role !== 'admin') {
    const myProjects = await Project.find({
      $or: [{ createdBy: req.user._id }, { 'members.user': req.user._id }],
    }).select('_id');
    filter.project = { $in: myProjects.map(p => p._id) };
  }

  if (project) filter.project = project;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignee) filter.assignee = assignee === 'me' ? req.user._id : assignee;
  if (overdue === 'true') { filter.status = { $ne: 'done' }; filter.dueDate = { $lt: new Date() }; }

  const skip = (Number(page) - 1) * Number(limit);
  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assignee', 'name avatar')
      .populate('project', 'name color')
      .populate('createdBy', 'name')
      .sort('-createdAt').skip(skip).limit(Number(limit)).lean(),
    Task.countDocuments(filter),
  ]);

  const now = new Date();
  res.json({
    success: true,
    data: tasks.map(t => ({ ...t, isOverdue: t.status !== 'done' && t.dueDate && t.dueDate < now })),
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
  });
});

exports.create = asyncHandler(async (req, res) => {
  const { title, description, project, assignee, status, priority, dueDate, tags } = req.body;
  const proj = await Project.findById(project);
  if (!proj) return res.status(404).json({ success: false, message: 'Project not found.' });
  const isMember = proj.members.some(m => m.user.toString() === req.user.id) || proj.createdBy.toString() === req.user.id;
  if (!isMember && req.user.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Not a member of this project.' });

  const task = await Task.create({
    title, description, project, assignee, status, priority, dueDate, tags,
    createdBy: req.user._id,
    statusHistory: [{ from: null, to: status || 'todo', changedBy: req.user._id }],
  });
  await task.populate('assignee', 'name avatar');
  await task.populate('project', 'name color');

  if (assignee && assignee.toString() !== req.user.id.toString()) {
    await notify({
      recipientId: assignee, actorId: req.user._id, type: 'task_assigned',
      title: 'New task assigned to you',
      message: req.user.name + ' assigned "' + title + '" to you in ' + (task.project && task.project.name ? task.project.name : ''),
      link: '/tasks/' + task._id, entityId: task._id.toString(),
    });
  }

  res.status(201).json({ success: true, message: 'Task created.', data: task });
});

exports.getOne = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignee', 'name email avatar')
    .populate('createdBy', 'name')
    .populate('project', 'name color members createdBy')
    .populate('comments.author', 'name avatar');
  if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

  if (req.user.role !== 'admin') {
    const proj = task.project;
    const ok = proj.members?.some(m => m.user?.toString() === req.user.id) || proj.createdBy?.toString() === req.user.id;
    if (!ok) return res.status(403).json({ success: false, message: 'Access denied.' });
  }
  res.json({ success: true, data: task });
});

exports.update = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

  const { title, description, assignee, priority, dueDate, tags, status } = req.body;
  if (status && status !== task.status) {
    task.statusHistory.push({ from: task.status, to: status, changedBy: req.user._id });
    task.status = status;
  }
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (assignee !== undefined) task.assignee = assignee;
  if (priority !== undefined) task.priority = priority;
  if (dueDate !== undefined) task.dueDate = dueDate;
  if (tags !== undefined) task.tags = tags;

  await task.save();
  await task.populate('assignee', 'name avatar');
  await task.populate('project', 'name color');
  res.json({ success: true, message: 'Task updated.', data: task });
});

exports.remove = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
  if (task.createdBy.toString() !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Only task creator or admin can delete.' });
  await task.deleteOne();
  res.json({ success: true, message: 'Task deleted.' });
});

exports.addComment = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
  task.comments.push({ author: req.user._id, text: req.body.text.trim() });
  await task.save();
  await task.populate('comments.author', 'name avatar');
  res.status(201).json({ success: true, data: task.comments.at(-1) });
});

exports.deleteComment = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
  const comment = task.comments.id(req.params.commentId);
  if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });
  if (comment.author.toString() !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Cannot delete this comment.' });
  comment.deleteOne();
  await task.save();
  res.json({ success: true, message: 'Comment deleted.' });
});

exports.getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const now = new Date();
  const [myTasks, overdueTasks, recentDone] = await Promise.all([
    Task.find({ assignee: userId }).select('status dueDate').lean(),
    Task.find({ assignee: userId, status: { $ne: 'done' }, dueDate: { $lt: now } })
      .populate('project', 'name color').sort('dueDate').limit(5).lean(),
    Task.find({ assignee: userId, status: 'done' })
      .select('title completedAt project').populate('project', 'name').sort('-completedAt').limit(5).lean(),
  ]);
  const sc = { todo: 0, 'in-progress': 0, 'in-review': 0, done: 0 };
  myTasks.forEach(t => { if (sc[t.status] !== undefined) sc[t.status]++; });
  res.json({ success: true, data: { totalAssigned: myTasks.length, statusCounts: sc, overdueCount: overdueTasks.length, overdueTasks, recentDone } });
});
