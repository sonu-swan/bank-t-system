const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const ctrl = require('../controllers/project.controller');
const { protect, restrictTo, requireProjectMember, requireProjectLead } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

router.use(protect);
router.get('/', ctrl.getAll);
router.post('/', restrictTo('admin'), [
  body('name').trim().notEmpty().isLength({ min: 2, max: 100 }),
  body('description').optional().isLength({ max: 500 }),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
  body('memberIds').optional().isArray(),
  body('deadline').optional().isISO8601(),
], validate, ctrl.create);
router.get('/:id', ctrl.getOne);
router.get('/:id/stats', ctrl.getStats);
router.patch('/:id', requireProjectMember, requireProjectLead, [
  body('name').optional().isLength({ min: 2, max: 100 }),
  body('status').optional().isIn(['active', 'on-hold', 'completed', 'archived']),
], validate, ctrl.update);
router.delete('/:id', restrictTo('admin'), ctrl.remove);
router.post('/:id/members', requireProjectMember, requireProjectLead, [
  body('userId').notEmpty(), body('role').optional().isIn(['lead', 'member']),
], validate, ctrl.addMember);
router.delete('/:id/members/:userId', requireProjectMember, requireProjectLead, ctrl.removeMember);

module.exports = router;
