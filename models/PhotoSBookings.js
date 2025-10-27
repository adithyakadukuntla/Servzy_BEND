const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId }, 
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other', ''] },
    address: { type: String, required: true },
});

const serviceProviderSchema = new mongoose.Schema({
    serviceProviderId: { type: mongoose.Schema.Types.ObjectId }, 
    businessName: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: false },
    phone: { type: String, required: true },
    serviceSelected: { type: String, required: true },
    rating: { 
        type: Number, 
        required: true, 
        min: 0, 
        max: 5 
    },
    totalShoots: { type: Number, required: true },
});

const bookingSchema = new mongoose.Schema({
    client: [clientSchema],
    serviceType: { type: String, required: true },
    serviceProvider: [serviceProviderSchema],
    money: { type: Number, required: true },
    accepted: { type: Boolean, default: null }, // null = pending, true = accepted, false = rejected
    completed: { type: Boolean, default: null },
    bookDate: { type: Date, required: true },
    bookTime: { type: Date, required: true }, 
    bookDateTime: { type: Date, required: true },
    
    // Cancellation fields
    cancelled: { type: Boolean, default: false },
    cancelledAt: { type: Date },
    cancelledBy: { 
        type: String, 
        enum: ['client', 'service_provider', 'admin'],
        default: null
    },
    cancellationReason: { type: String },
    
    // Payment and refund fields
    paymentStatus: {
        type: String, 
        enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
        default: 'pending'
    },
    refundAmount: { type: Number, default: 0 },
    refundPercentage: { type: Number, default: 0 },
    refundStatus: {
        type: String,
        enum: ['none', 'pending', 'processed', 'failed'],
        default: 'none'
    },
    refundProcessedAt: { type: Date },
    
    // Status tracking
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed', 'in_progress'],
        default: 'pending'
    }
}, { timestamps: true });

// Indexes for better query performance
bookingSchema.index({ 'client.clientId': 1, cancelled: 1 });
bookingSchema.index({ 'serviceProvider.serviceProviderId': 1, cancelled: 1 });
bookingSchema.index({ bookDateTime: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ createdAt: -1 });

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
