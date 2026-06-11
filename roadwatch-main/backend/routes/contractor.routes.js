const express = require('express');
const router = express.Router();
const contractorController = require('../controllers/contractor.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

router.get('/', contractorController.getContractors);
router.get('/leaderboard', contractorController.getContractors); // alias used by frontend
router.get('/:id', contractorController.getContractorById);
router.post('/:id/rate', verifyToken, contractorController.rateContractor);
router.post('/:id/flag', verifyToken, contractorController.flagContractor);
router.patch('/:id/flag', verifyToken, requireRole(['admin']), contractorController.flagContractor);

module.exports = router;

