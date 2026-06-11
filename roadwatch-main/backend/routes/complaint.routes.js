const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaint.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');
const { upload } = require('../middlewares/upload.middleware');

router.post('/', verifyToken, upload.array('media', 5), complaintController.createComplaint);
router.get('/', complaintController.getComplaints);
router.get('/nearby', complaintController.getNearby);
router.get('/:id', complaintController.getComplaintById);
router.patch('/:id/status', verifyToken, requireRole(['ward_authority', 'city_engineer', 'volunteer', 'admin']), complaintController.updateStatus);
router.post('/:id/upvote', verifyToken, complaintController.upvote);
router.delete('/:id/upvote', verifyToken, complaintController.removeUpvote);
router.post('/voice', verifyToken, upload.single('audio'), complaintController.voiceComplaint);

module.exports = router;
