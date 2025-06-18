const mongoose = require('mongoose');

// Review Schema for embedded reviews
const reviewSchema = new mongoose.Schema({
    userName: { 
        type: String, 
        required: true 
    },
    rating: { 
        type: Number, 
        required: true, 
        min: 1, 
        max: 5 
    },
    comment: { 
        type: String, 
        required: true 
    },
    date: { 
        type: Date, 
        default: Date.now 
    }
}, { _id: true });

// Main Photographer Schema
const photographerSchema = new mongoose.Schema({
    // Authentication fields
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true
    },
    password: { 
        type: String, 
        required: true,
        minlength: 6
    },
    
    // Basic Information
    businessName: { 
        type: String, 
        required: false,
        trim: true
    },
    name: { 
        type: String, 
        required: false,
        trim: true
    },
    phone: { 
        type: String,
        required: false
    },
    
    // Professional Information
    specialization: { 
        type: String, 
        required: false,
        enum: [
            'Wedding & Portrait',
            'Fashion & Commercial', 
            'Event & Corporate',
            'Nature & Wildlife',
            'Product Photography',
            'Street Photography',
            'Documentary',
            'Architecture',
            'Food Photography',
            'Other'
        ]
    },
    
    // Location
    location: { 
        type: String, 
        required: false 
    },
    city: { 
        type: String, 
        required: false 
    },
    state: { 
        type: String, 
        required: false 
    },
    pincode:{
        type:String,
    },
    expoPushToken:{type:String},
    
    // Pricing
    priceRange: {
        min: { 
            type: Number, 
            required: false 
        },
        max: { 
            type: Number, 
            required: false 
        },
        currency: { 
            type: String, 
            default: 'INR' 
        }
    },
    
    // Profile and Portfolio
    profileImage: { 
        type: String,
        default: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4YreOWfDX3kK-QLAbAL4ufCPc84ol2MA8Xg&s'
    },
    portfolio: [{
        type: String,
        
    }],
    
    // About and Experience
    about: { 
        type: String,
        maxlength: 1000
    },
    yearsOfExperience: { 
        type: Number,
        min: 0,
        max: 50
    },
    
    // Statistics (calculated fields)
    rating: { 
        type: Number, 
        default: 0,
        min: 0,
        max: 5
    },
    totalReviews: { 
        type: Number, 
        default: 0 
    },
    totalShoots: { 
        type: Number, 
        default: 0 
    },
    
    // Reviews (embedded documents)
    reviews: [reviewSchema],
    
    // Verification and Status
    verified: { 
        type: Boolean, 
        default: false 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    
    // Documents for verification
    documents: {
        aadharNumber: { type: String },
        panNumber: { type: String },
        businessLicense: { type: String },
        portfolioWebsite: { type: String }
    },
    
    // Equipment and Services
    equipment: [{
        type: String
    }],
    services: [{
        type: String,
        enum: [
            'Wedding Photography',
            'Pre-Wedding Shoot',
            'Portrait Session',
            'Event Coverage',
            'Product Photography',
            'Fashion Shoot',
            'Corporate Events',
            'Birthday Parties',
            'Anniversary Shoot',
            'Maternity Shoot',
            'Baby Photography',
            'Other'
        ]
    }],
    
    // Availability
    availability: {
        weekdays: { type: Boolean, default: true },
        weekends: { type: Boolean, default: true },
        holidays: { type: Boolean, default: false }
    },
    
    // Social Media Links
    socialMedia: {
        instagram: { type: String },
        facebook: { type: String },
        website: { type: String },
        youtube: { type: String }
    }
    
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for formatted price range
photographerSchema.virtual('formattedPriceRange').get(function() {
    return `₹${this.priceRange.min.toLocaleString()} - ₹${this.priceRange.max.toLocaleString()}`;
});

// Virtual for average rating calculation
photographerSchema.virtual('averageRating').get(function() {
    if (this.reviews.length === 0) return 0;
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / this.reviews.length).toFixed(1);
});

// Pre-save middleware to update statistics
photographerSchema.pre('save', function(next) {
    if (this.reviews && this.reviews.length > 0) {
        // Update total reviews
        this.totalReviews = this.reviews.length;
        
        // Calculate average rating
        const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
        this.rating = (sum / this.reviews.length);
    }
    next();
});

// Index for better search performance
photographerSchema.index({ location: 1, specialization: 1 });
photographerSchema.index({ rating: -1 });
photographerSchema.index({ verified: 1, isActive: 1 });
photographerSchema.index({ 'priceRange.min': 1, 'priceRange.max': 1 });

// Static method to find photographers by location
photographerSchema.statics.findByLocation = function(city, state) {
    return this.find({ 
        city: new RegExp(city, 'i'), 
        state: new RegExp(state, 'i'),
        isActive: true 
    });
};

// Static method to find photographers by specialization
photographerSchema.statics.findBySpecialization = function(specialization) {
    return this.find({ 
        specialization: new RegExp(specialization, 'i'),
        isActive: true 
    });
};

// Static method to find photographers within price range
photographerSchema.statics.findByPriceRange = function(minPrice, maxPrice) {
    return this.find({
        'priceRange.min': { $lte: maxPrice },
        'priceRange.max': { $gte: minPrice },
        isActive: true
    });
};

// Instance method to add review
photographerSchema.methods.addReview = function(reviewData) {
    this.reviews.push(reviewData);
    return this.save();
};

// Instance method to increment shoot count
photographerSchema.methods.incrementShootCount = function() {
    this.totalShoots += 1;
    return this.save();
};
photographerSchema.methods.addPortfolioImage = function(imageUrl) {
  if (!this.portfolio.includes(imageUrl)) {
    this.portfolio.push(imageUrl);
    return this.save();
  }
  throw new Error('Image already exists in portfolio');
};
const Photographer = mongoose.model('Photographer', photographerSchema);
module.exports = Photographer;
