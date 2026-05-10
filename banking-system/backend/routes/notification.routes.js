const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', ctrl.getAll);
router.get('/unread-count', ctrl.unreadCount);
router.patch('/read-all', ctrl.markAllRead);
router.delete('/clear-all', ctrl.clearAll);
router.patch('/:id/read', ctrl.markRead);
router.delete('/:id', ctrl.remove);

module.exports = router;
