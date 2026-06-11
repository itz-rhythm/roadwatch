const express = require('express');
const router = express.Router();
const roadController = require('../controllers/road.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

router.get('/', roadController.getRoads);
router.get('/:id', roadController.getRoadById);
router.post('/', verifyToken, requireRole(['admin']), roadController.createRoad);
router.patch('/:id', verifyToken, requireRole(['admin', 'city_engineer']), roadController.updateRoad);
router.get('/:id/predict-failure', roadController.predictFailure);

module.exports = router;
