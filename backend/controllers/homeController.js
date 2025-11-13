const Home = require('../models/Home');

exports.getHomes = async (req, res) => {
    try {
        const homes = await Home.find({ user: req.user.id });
        
        res.status(200).json({
            success: true,
            count: homes.length,
            data: homes
        });
        
    } catch (error) {
        console.error('Get homes error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.createHome = async (req, res) => {
    try {
        const { name, electricityRate } = req.body;
        
        const home = await Home.create({
            user: req.user.id,
            name: name || 'My Home',
            electricityRate: electricityRate || 7.5,
            rooms: [
                {
                    name: 'Living Room',
                    icon: '🛋️',
                    devices: [
                        { name: 'TV', type: 'TV', powerRating: 150 },
                        { name: 'AC', type: 'AC', powerRating: 1500 }
                    ]
                },
                {
                    name: 'Kitchen',
                    icon: '🍳',
                    devices: [
                        { name: 'Refrigerator', type: 'Refrigerator', powerRating: 200 },
                        { name: 'Microwave', type: 'Other', powerRating: 1000 }
                    ]
                }
            ]
        });
        
        res.status(201).json({
            success: true,
            message: 'Home created successfully',
            data: home
        });
        
    } catch (error) {
        console.error('Create home error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.addRoom = async (req, res) => {
    try {
        const { name, icon } = req.body;
        
        const home = await Home.findOne({ _id: req.params.id, user: req.user.id });
        
        if (!home) {
            return res.status(404).json({
                success: false,
                message: 'Home not found'
            });
        }
        
        home.rooms.push({
            name: name || 'New Room',
            icon: icon || '🏠',
            devices: []
        });
        
        await home.save();
        
        res.status(200).json({
            success: true,
            message: 'Room added successfully',
            data: home
        });
        
    } catch (error) {
        console.error('Add room error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.addDevice = async (req, res) => {
    try {
        const { name, type, powerRating } = req.body;
        const { homeId, roomId } = req.params;
        
        const home = await Home.findOne({ _id: homeId, user: req.user.id });
        
        if (!home) {
            return res.status(404).json({
                success: false,
                message: 'Home not found'
            });
        }
        
        const room = home.rooms.id(roomId);
        
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }
        
        room.devices.push({
            name: name || 'New Device',
            type: type || 'Other',
            powerRating: powerRating || 100
        });
        
        await home.save();
        
        res.status(200).json({
            success: true,
            message: 'Device added successfully',
            data: home
        });
        
    } catch (error) {
        console.error('Add device error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};