const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/analytics.controller');
router.use(protect);
router.get('/overview', ctrl.getOverview);
module.exports = router;
