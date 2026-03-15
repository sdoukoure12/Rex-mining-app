const express = require('express');
const router = express.Router();
const miningController = require('../controllers/miningController');
const aiController = require('../controllers/aiController');

router.get('/mining/stats', miningController.getStats);
router.get('/mining/workers', miningController.getWorkers);
router.post('/mining/schedule', miningController.scheduleTask);

router.get('/ai/insights', aiController.getInsights);

module.exports = router;
