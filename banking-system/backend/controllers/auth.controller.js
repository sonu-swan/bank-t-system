const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { asyncHandler } = require('../middleware/error.middleware');

const signAccess = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const signRefresh = id => jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' });

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const assignedRole = process.env.NODE_ENV === 'development' ? (role || 'member') : 'member';
  const user = await User.create({ name, email, password, role: assignedRole });
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });
  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    data: { accessToken: signAccess(user._id, user.role), refreshToken: signRefresh(user._id), user: user.toPublic() },
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  if (!user.isActive)
    return res.status(401).json({ success: false, message: 'Account deactivated. Contact admin.' });
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });
  res.json({
    success: true,
    message: 'Login successful.',
    data: { accessToken: signAccess(user._id, user.role), refreshToken: signRefresh(user._id), user: user.toPublic() },
  });
});

exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required.' });
  let decoded;
  try { decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET); }
  catch { return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' }); }
  const user = await User.findById(decoded.id);
  if (!user) return res.status(401).json({ success: false, message: 'User not found.' });
  res.json({ success: true, data: { accessToken: signAccess(user._id, user.role) } });
});

exports.getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user.toPublic() });
});

exports.updateMe = asyncHandler(async (req, res) => {
  const { name, avatar } = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, { name, avatar }, { new: true, runValidators: true });
  res.json({ success: true, data: user.toPublic() });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword)))
    return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password changed.' });
});
