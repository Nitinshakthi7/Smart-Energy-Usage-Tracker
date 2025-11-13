const express = require('express');
const router = express.Router();
const { 
    submitReading, 
    submitBatchReadings 
} = require('../controllers/readingController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', submitReading);
router.post('/batch', submitBatchReadings);

module.exports = router;
