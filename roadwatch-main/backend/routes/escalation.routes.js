const express = require('express');
const router = express.Router();
const escalationController = require('../controllers/escalation.controller');

router.post('/check', escalationController.checkEscalations);
router.get('/:complaint_id', escalationController.getEscalationHistory);

module.exports = router;
