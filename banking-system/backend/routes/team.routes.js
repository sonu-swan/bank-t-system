const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const ctrl = require('../controllers/team.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

router.use(protect, restrictTo('admin'));
router.get('/', ctrl.getAll);
router.patch('/:id/role', [body('role').isIn(['admin', 'member'])], validate, ctrl.changeRole);
router.delete('/:id', ctrl.deactivate);

module.exports = router;
