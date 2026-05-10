const Task = require('../models/Task.model');
const Project = require('../models/Project.model');
const { asyncHandler } = require('../middleware/error.middleware');

exports.search = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.json({ success: true, data: { tasks: [], projects: [] } });
  }

  const regex = new RegExp(q.trim(), 'i');

  // Scope to accessible projects for non-admins
  let projectFilter = {};
  if (req.user.role !== 'admin') {
    const myProjects = await Project.find({
      $or: [{ createdBy: req.user._id }, { 'members.user': req.user._id }],
    }).select('_id');
    const ids = myProjects.map(p => p._id);
    projectFilter = { _id: { $in: ids } };
  }

  const [tasks, projects] = await Promise.all([
    Task.find({
      $or: [{ title: regex }, { description: regex }, { tags: regex }],
      ...(req.user.role !== 'admin' && {
        project: { $in: (await Project.find(projectFilter).select('_id')).map(p => p._id) },
      }),
    })
      .select('title status priority dueDate project assignee')
      .populate('project', 'name color')
      .populate('assignee', 'name')
      .limit(10)
      .lean(),

    Project.find({ $or: [{ name: regex }, { description: regex }], ...projectFilter })
      .select('name description color status members')
      .limit(5)
      .lean(),
  ]);

  res.json({ success: true, data: { tasks, projects, query: q } });
});
