const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // Basic Auth Fields
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    
    // Personal Info Fields
    name: { type: String },
    phone: { type: String },
    gender: { type: String, enum: ['Male', 'Female', 'Other', ''] },
    dateofbirth: { type: String },
    emergencyContact: { type: String },
    
    // Location Fields
    location: { type: String }, // Full address
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    
    // System Fields
    rating: { type: Number, default: 0 },
    rateCount: { type: Number, default: 0 },
    termsAccepted: { type: Boolean, default: false },
    termsAcceptedDate: { type: Date },
    privacyPolicyAccepted: { type: Boolean, default: false },
    privacyPolicyAcceptedDate: { type: Date },
    
    // Account Status
    isActive: { type: Boolean, default: true },
    profileComplete: { type: Boolean, default: false },
    
    expoPushToken: {
        type: String,
        default: null
  }
}, { timestamps: true });

// Method to check if profile is complete
userSchema.methods.isProfileComplete = function() {
    const requiredFields = ['name', 'phone', 'gender', 'dateofbirth', 'emergencyContact', 'location', 'city', 'state'];
    return requiredFields.every(field => this[field] && this[field].toString().trim() !== '');
};

const User = mongoose.model('User', userSchema);

module.exports = User;
