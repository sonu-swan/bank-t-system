// task.routes.js
const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();
const ctrl = require('../controllers/task.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

router.use(protect);
router.get('/dashboard', ctrl.getDashboard);
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['todo', 'in-progress', 'in-review', 'done']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
], validate, ctrl.getAll);
router.post('/', restrictTo('admin'), [
  body('title').trim().notEmpty().isLength({ min: 2, max: 200 }),
  body('project').notEmpty(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('status').optional().isIn(['todo', 'in-progress', 'in-review', 'done']),
  body('dueDate').optional().isISO8601(),
], validate, ctrl.create);
router.get('/:id', ctrl.getOne);
router.patch('/:id', [
  body('title').optional().isLength({ min: 2, max: 200 }),
  body('status').optional().isIn(['todo', 'in-progress', 'in-review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('dueDate').optional().isISO8601(),
], validate, ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/comments', [body('text').trim().notEmpty().isLength({ max: 1000 })], validate, ctrl.addComment);
router.delete('/:id/comments/:commentId', ctrl.deleteComment);

module.exports = router;
