const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { runOverdueCheck } = require('../utils/overdueReminder');

router.use(protect, restrictTo('admin'));

// POST /api/internal/run-overdue-check
router.post('/run-overdue-check', asyncHandler(async (req, res) => {
  const count = await runOverdueCheck();
  res.json({ success: true, message: `Overdue check complete. Notified for ${count} tasks.` });
}));

module.exports = router;
