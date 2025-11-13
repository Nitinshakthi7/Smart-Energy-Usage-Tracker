const mongoose = require('mongoose');

const EnergyReadingSchema = new mongoose.Schema({
    home: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Home',
        required: true
    },

    device: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    
    room: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    
    deviceName: {
        type: String,
        required: true
    },
    
    roomName: {
        type: String,
        required: true
    },
    
    watts: {
        type: Number,
        required: true,
        min: 0
    },
    
    duration: {
        type: Number,
        required: true,
        min: 0
    },
    
    energyConsumed: {
        type: Number,
        required: true
    },
    
    timestamp: {
        type: Date,
        default: Date.now
    }
});

EnergyReadingSchema.index({ home: 1, timestamp: -1 });

module.exports = mongoose.model('EnergyReading', EnergyReadingSchema);
