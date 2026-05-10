const Notification = require('../models/Notification.model');
const { asyncHandler } = require('../middleware/error.middleware');

// GET /api/notifications
exports.getAll = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const filter = { recipient: req.user._id };
  if (unreadOnly === 'true') filter.read = false;

  const skip = (Number(page) - 1) * Number(limit);
  const [notifications, unreadCount] = await Promise.all([
    Notification.find(filter)
      .populate('actor', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Notification.countDocuments({ recipient: req.user._id, read: false }),
  ]);

  res.json({
    success: true,
    data: notifications,
    unreadCount,
    pagination: {
      total: await Notification.countDocuments(filter),
      page: Number(page),
      limit: Number(limit),
    },
  });
});

// PATCH /api/notifications/:id/read
exports.markRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { read: true }
  );
  res.json({ success: true, message: 'Marked as read.' });
});

// PATCH /api/notifications/read-all
exports.markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  res.json({ success: true, message: 'All notifications marked as read.' });
});

// DELETE /api/notifications/:id
exports.remove = asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
  res.json({ success: true, message: 'Notification deleted.' });
});

// DELETE /api/notifications/clear-all
exports.clearAll = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ recipient: req.user._id });
  res.json({ success: true, message: 'All notifications cleared.' });
});

// GET /api/notifications/unread-count
exports.unreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user._id, read: false });
  res.json({ success: true, count });
});
