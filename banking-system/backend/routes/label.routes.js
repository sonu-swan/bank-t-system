const express = require('express');
const { body } = require('express-validator');
const router = express.Router({ mergeParams: true });
const { protect, requireProjectMember } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const ctrl = require('../controllers/label.controller');

router.use(protect, requireProjectMember);
router.get('/', ctrl.getByProject);
router.post('/', [
  body('name').trim().notEmpty().isLength({ max: 30 }),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
], validate, ctrl.create);
router.patch('/:labelId', ctrl.update);
router.delete('/:labelId', ctrl.remove);

module.exports = router;
