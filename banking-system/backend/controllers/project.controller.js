const mongoose = require('mongoose');
const Project = require('../models/Project.model');
const Task = require('../models/Task.model');
const User = require('../models/User.model');
const { asyncHandler } = require('../middleware/error.middleware');

exports.getAll = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} :
    { $or: [{ createdBy: req.user._id }, { 'members.user': req.user._id }] };

  const projects = await Project.find(filter)
    .populate('createdBy', 'name email avatar')
    .populate('members.user', 'name email avatar')
    .sort('-createdAt').lean();

  const taskCounts = await Task.aggregate([
    { $match: { project: { $in: projects.map(p => p._id) } } },
    { $group: { _id: '$project', total: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } } } },
  ]);
  const cm = {};
  taskCounts.forEach(t => { cm[t._id.toString()] = t; });

  res.json({
    success: true, count: projects.length,
    data: projects.map(p => ({ ...p, taskCount: cm[p._id.toString()]?.total || 0, completedCount: cm[p._id.toString()]?.done || 0 })),
  });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, description, color, memberIds, deadline } = req.body;
  const project = await Project.create({
    name, description, color, deadline, createdBy: req.user._id,
    members: [
      { user: req.user._id, role: 'lead' },
      ...(memberIds || []).filter(id => id !== req.user.id.toString()).map(id => ({ user: id, role: 'member' })),
    ],
  });
  await project.populate('createdBy', 'name email avatar');
  await project.populate('members.user', 'name email avatar');
  res.status(201).json({ success: true, message: 'Project created.', data: project });
});

exports.getOne = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('createdBy', 'name email avatar')
    .populate('members.user', 'name email avatar role');
  if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
  if (req.user.role !== 'admin') {
    const ok = project.members.some(m => m.user._id.toString() === req.user.id) || project.createdBy._id.toString() === req.user.id;
    if (!ok) return res.status(403).json({ success: false, message: 'Access denied.' });
  }
  const tasks = await Task.find({ project: project._id }).populate('assignee', 'name avatar').sort('-createdAt');
  res.json({ success: true, data: { project, tasks } });
});

exports.update = asyncHandler(async (req, res) => {
  const { name, description, color, status, deadline } = req.body;
  const project = await Project.findByIdAndUpdate(req.params.id,
    { $set: { name, description, color, status, deadline } },
    { new: true, runValidators: true }
  ).populate('members.user', 'name email');
  if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
  res.json({ success: true, message: 'Project updated.', data: project });
});

exports.remove = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
  await Task.deleteMany({ project: project._id });
  await project.deleteOne();
  res.json({ success: true, message: 'Project and all tasks deleted.' });
});

exports.addMember = asyncHandler(async (req, res) => {
  const { userId, role = 'member' } = req.body;
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  if (project.members.some(m => m.user.toString() === userId))
    return res.status(409).json({ success: false, message: 'Already a member.' });
  project.members.push({ user: userId, role });
  await project.save();
  await project.populate('members.user', 'name email avatar');
  res.json({ success: true, message: `${user.name} added.`, data: project });
});

exports.removeMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
  if (project.createdBy.toString() === req.params.userId)
    return res.status(400).json({ success: false, message: 'Cannot remove project creator.' });
  project.members = project.members.filter(m => m.user.toString() !== req.params.userId);
  await project.save();
  res.json({ success: true, message: 'Member removed.' });
});

exports.getStats = asyncHandler(async (req, res) => {
  const pid = new mongoose.Types.ObjectId(req.params.id);
  const stats = await Task.aggregate([
    { $match: { project: pid } },
    { $group: {
      _id: '$status', count: { $sum: 1 },
      overdue: { $sum: { $cond: [{ $and: [{ $ne: ['$status', 'done'] }, { $lt: ['$dueDate', new Date()] }] }, 1, 0] } }
    }},
  ]);
  const result = { todo: 0, 'in-progress': 0, 'in-review': 0, done: 0, overdue: 0 };
  stats.forEach(s => { result[s._id] = s.count; result.overdue += s.overdue; });
  res.json({ success: true, data: result });
});
