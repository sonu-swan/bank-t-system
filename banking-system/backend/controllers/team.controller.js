const User = require('../models/User.model');
const Task = require('../models/Task.model');
const { asyncHandler } = require('../middleware/error.middleware');

exports.getAll = asyncHandler(async (req, res) => {
  const users = await User.find({ isActive: true }).sort('name').lean();
  const taskStats = await Task.aggregate([
    { $group: { _id: '$assignee', total: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } } } },
  ]);
  const sm = {};
  taskStats.forEach(s => { sm[s._id?.toString()] = s; });
  res.json({
    success: true, count: users.length,
    data: users.map(u => ({ ...u, tasksAssigned: sm[u._id.toString()]?.total || 0, tasksCompleted: sm[u._id.toString()]?.done || 0 })),
  });
});

exports.changeRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'member'].includes(role))
    return res.status(400).json({ success: false, message: 'Role must be admin or member.' });
  if (req.params.id === req.user.id)
    return res.status(400).json({ success: false, message: 'Cannot change your own role.' });
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  res.json({ success: true, message: `${user.name} is now ${role}.`, data: user.toPublic() });
});

exports.deactivate = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id)
    return res.status(400).json({ success: false, message: 'Cannot deactivate your own account.' });
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  res.json({ success: true, message: `${user.name} deactivated.` });
});
