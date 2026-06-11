const express = require('express');
const router = express.Router();
const rtiController = require('../controllers/rti.controller');

router.get('/generate', rtiController.generateRti);
router.get('/download', rtiController.downloadRti);
router.get('/ward-report', rtiController.exportWardReport);

module.exports = router;
