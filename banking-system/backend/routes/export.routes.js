// export.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/export.controller');
router.use(protect);
router.get('/tasks.csv', ctrl.exportTasksCSV);
module.exports = router;
