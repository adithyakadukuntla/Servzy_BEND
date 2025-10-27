// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'recipientType'
    },
    recipientType: {
        type: String,
        required: true,
        enum: ['User', 'Photographer']
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'senderType'
    },
    senderType: {
        type: String,
        enum: ['User', 'Photographer', 'System']
    },
    type: {
        type: String,
        required: true,
        enum: [
            'booking_created',
            'booking_accepted', 
            'booking_rejected',
            'booking_cancelled',
            'booking_completed',
            'payment_received',
            'refund_processed',
            'reminder'
        ]
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    },
    data: {
        type: mongoose.Schema.Types.Mixed, // For additional data
        default: {}
    },
    read: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    }
}, { timestamps: true });

// Indexes
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
