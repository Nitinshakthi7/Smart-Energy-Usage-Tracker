const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['AC', 'Refrigerator', 'TV', 'Washing Machine', 'Water Heater', 'Lights', 'Fan', 'Other']
    },
    powerRating: {
        type: Number,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

const RoomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    icon: {
        type: String,
        default: '🏠'
    },
    devices: [DeviceSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const HomeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    name: {
        type: String,
        required: true,
        trim: true,
        default: 'My Home'
    },
    
    electricityRate: {
        type: Number,
        default: 7.5
    },
    
    rooms: [RoomSchema],
    
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Home', HomeSchema);
