const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');

router.get('/heatmap', dashboardController.getHeatmap);
router.get('/ward-rankings', dashboardController.getWardRankings);
router.get('/blackspots', dashboardController.getBlackspots);
router.get('/budget-transparency', dashboardController.getBudgetTransparency);
router.get('/contractor-leaderboard', dashboardController.getContractorLeaderboard);
router.get('/city-overview', dashboardController.getCityOverview);

module.exports = router;
