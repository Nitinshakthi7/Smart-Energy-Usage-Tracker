const express = require('express');
const router = express.Router();
const { 
    getHomes, 
    createHome, 
    addRoom, 
    addDevice 
} = require('../controllers/homeController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
    .get(getHomes)
    .post(createHome);

router.post('/:id/rooms', addRoom);
router.post('/:homeId/rooms/:roomId/devices', addDevice);

module.exports = router;
