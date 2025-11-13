const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
    home: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Home',
        required: true
    },
    
    type: {
        type: String,
        required: true,
        enum: ['warning', 'info', 'success']
    },
    
    title: {
        type: String,
        required: true
    },
    
    message: {
        type: String,
        required: true
    },
    
    device: {
        type: mongoose.Schema.Types.ObjectId
    },
    
    isRead: {
        type: Boolean,
        default: false
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Alert', AlertSchema);
