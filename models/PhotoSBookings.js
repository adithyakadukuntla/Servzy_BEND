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
    businessName:{type:String,required:true},
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
    money:{type:Number,required:true},
    accepted:{type:Boolean,default:null},
    completed:{type:Boolean,default:null},
    bookDate: { type: Date, required: true },
    bookTime: { type: Date, required: true }, 
    bookDateTime: { type: Date, required: true },
    


}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
