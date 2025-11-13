const EnergyReading = require('../models/EnergyReading');
const Home = require('../models/Home');

exports.submitReading = async (req, res) => {
    try {
        const { homeId, roomId, deviceId, watts, duration } = req.body;
        
        if (!homeId || !roomId || !deviceId || !watts || !duration) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }
        
        const home = await Home.findOne({ _id: homeId, user: req.user.id });
        
        if (!home) {
            return res.status(404).json({
                success: false,
                message: 'Home not found'
            });
        }
        
        const room = home.rooms.id(roomId);
        const device = room ? room.devices.id(deviceId) : null;
        
        if (!room || !device) {
            return res.status(404).json({
                success: false,
                message: 'Room or device not found'
            });
        }
        
        const energyConsumed = (watts * duration) / 60000;
        
        const reading = await EnergyReading.create({
            home: homeId,
            room: roomId,
            device: deviceId,
            roomName: room.name,
            deviceName: device.name,
            watts,
            duration,
            energyConsumed
        });
        
        res.status(201).json({
            success: true,
            message: 'Reading submitted successfully',
            data: reading
        });
        
    } catch (error) => {
        console.error('Submit reading error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.submitBatchReadings = async (req, res) => {
    try {
        const { homeId } = req.body;
        
        const home = await Home.findOne({ _id: homeId, user: req.user.id });
        
        if (!home) {
            return res.status(404).json({
                success: false,
                message: 'Home not found'
            });
        }
        
        const readings = [];
        
        for (const room of home.rooms) {
            for (const device of room.devices) {
                for (let i = 0; i < 24; i++) {
                    const watts = device.powerRating * (0.5 + Math.random() * 0.5);
                    const duration = 30 + Math.random() * 30;
                    const energyConsumed = (watts * duration) / 60000;
                    
                    readings.push({
                        home: homeId,
                        room: room._id,
                        device: device._id,
                        roomName: room.name,
                        deviceName: device.name,
                        watts,
                        duration,
                        energyConsumed,
                        timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000)
                    });
                }
            }
        }
        
        await EnergyReading.insertMany(readings);
        
        res.status(201).json({
            success: true,
            message: `${readings.length} readings generated successfully`,
            count: readings.length
        });
        
    } catch (error) {
        console.error('Batch readings error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};