// auth.routes.js
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

router.post('/register', [
  body('name').trim().notEmpty().isLength({ min: 2, max: 60 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Min 8 characters'),
  body('role').optional().isIn(['admin', 'member']),
], validate, ctrl.register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], validate, ctrl.login);

router.post('/refresh', [body('refreshToken').notEmpty()], validate, ctrl.refresh);
router.get('/me', protect, ctrl.getMe);
router.patch('/me', protect, [body('name').optional().trim().isLength({ min: 2 })], validate, ctrl.updateMe);
router.patch('/change-password', protect, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
], validate, ctrl.changePassword);

module.exports = router;
