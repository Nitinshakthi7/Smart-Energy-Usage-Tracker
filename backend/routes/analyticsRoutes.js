const express = require('express');
const router = express.Router();
const { 
    getDashboardData, 
    getHeatMapData 
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard/:homeId', getDashboardData);
router.get('/heatmap/:homeId', getHeatMapData);

module.exports = router;
