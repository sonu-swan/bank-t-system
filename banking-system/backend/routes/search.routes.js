// search.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/search.controller');
router.use(protect);
router.get('/', ctrl.search);
module.exports = router;
