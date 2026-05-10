const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Project = require('../models/Project.model');
const { asyncHandler } = require('./error.middleware');

const protect = asyncHandler(async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'No token provided.' });

  const token = auth.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ success: false, message: err.name === 'TokenExpiredError' ? 'Token expired.' : 'Invalid token.' });
  }

  const user = await User.findById(decoded.id).select('+passwordChangedAt');
  if (!user || !user.isActive)
    return res.status(401).json({ success: false, message: 'User not found or deactivated.' });
  if (user.passwordChangedAfter(decoded.iat))
    return res.status(401).json({ success: false, message: 'Password changed. Please log in again.' });

  req.user = user;
  next();
});

const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ success: false, message: 'You do not have permission to do this.' });
  next();
};

const requireProjectMember = asyncHandler(async (req, res, next) => {
  const projectId = req.params.projectId || req.params.id || req.body.project;
  const project = await Project.findById(projectId);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

  const isMember = project.members.some(m => m.user.toString() === req.user.id);
  const isCreator = project.createdBy.toString() === req.user.id;
  if (!isMember && !isCreator && req.user.role !== 'admin')
    return res.status(403).json({ success: false, message: 'You are not a member of this project.' });

  req.project = project;
  next();
});

const requireProjectLead = (req, res, next) => {
  const project = req.project;
  const memberEntry = project?.members.find(m => m.user.toString() === req.user.id);
  const isLead = memberEntry?.role === 'lead';
  const isCreator = project?.createdBy.toString() === req.user.id;
  if (!isLead && !isCreator && req.user.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Project lead or admin access required.' });
  next();
};

module.exports = { protect, restrictTo, requireProjectMember, requireProjectLead };
