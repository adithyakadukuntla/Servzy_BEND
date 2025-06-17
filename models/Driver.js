const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String },  // Driver will enter these later
    phone: { type: String },
    yearsOfExperience: { type: Number },
    aadharNumber: { type: String },
    panNumber: { type: String },
    licenseNumber: { type: String },
    verified: { type: Boolean, default: false },
}, { timestamps: true });

const Driver = mongoose.model('Driver', driverSchema);
module.exports = Driver;
