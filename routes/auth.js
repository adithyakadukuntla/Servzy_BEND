const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require('../models/User');

const router = express.Router();
router.get('/',async(req,res)=>{
    res.send({message:"auth first route "})
})

// Register Route
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, message: "Email already registered" });
        }

        // Hash password and save
        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({
            email,
            password: hashedPassword
        });
        await user.save();

        res.json({ success: true, message: "User registered successfully" });
    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ success: false, message: "Server Error", err });
    }
});

// Login Route
router.post('/userlogin', async (req, res) => {
    const { email, password } = req.body;
    console.log("req",req.body);
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        const pass_match = await bcrypt.compare(password, user.password);
        if (!pass_match) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1d' });

        // Don't send password back
        const safeUser = { ...user._doc };
        delete safeUser.password;

        res.json({
            message: "Login successful",
            token,
            user: safeUser
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server Error", err });
    }
});

router.put('/complete-profile/:id', async (req, res) => {
    const userId = req.params.id;
    const { name, phone, gender, dateofbirth, emergencyContact, location, city, state, pincode } = req.body;
    
    try {
        // Validation
        const requiredFields = { name, phone, gender, dateofbirth, emergencyContact, location, city, state };
        const missingFields = Object.entries(requiredFields)
            .filter(([key, value]) => !value || value.toString().trim() === '')
            .map(([key]) => key);

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Update user with complete profile
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                name,
                phone,
                gender,
                dateofbirth,
                emergencyContact,
                location,
                city,
                state,
                pincode: pincode || '',
                profileComplete: true
            },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        res.json({
            success: true,
            message: "Profile completed successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error('Profile completion error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to complete profile",
            error: error.message 
        });
    }
});



// In your user routes file
router.put('/accept-terms/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                termsAccepted: true,
                termsAcceptedDate: new Date(),
                privacyPolicyAccepted: true,
                privacyPolicyAcceptedDate: new Date()
            },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ 
            message: "Terms accepted successfully", 
            payload: updatedUser 
        });
    } catch (error) {
        console.error('Error accepting terms:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


module.exports = router;
