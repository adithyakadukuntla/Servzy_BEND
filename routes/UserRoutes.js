const express = require('express');
const User = require('../models/User');

const userRouter = express.Router();




// Get user by ID
userRouter.get('/:id', async (req, res) => {
    const id = req.params.id;
    try {
        let details = await User.findById(id).select('-password');
        if (details) {
            res.json({ message: "UserDetails", payload: details });
        } else {
            res.status(400).json({ message: "UserNotFound" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error Occurred" });
        console.log("error", error);
    }
});

// Update user by ID
userRouter.put('/:id', async (req, res) => {
    const id = req.params.id;
    const updatedData = req.body;
    
    try {
        // Check if phone number is being updated and if it already exists
        if (updatedData.phone) {
            const existingUser = await User.findOne({ 
                phone: updatedData.phone, 
                _id: { $ne: id } 
            });
            
            if (existingUser) {
                return res.status(400).json({ 
                    message: "Phone number is already in use by another user" 
                });
            }
        }

        let userDetails = await User.findByIdAndUpdate(
            id,
            updatedData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!userDetails) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User updated successfully", payload: userDetails });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


// Post to UserRating
userRouter.post('/userrating/:id', async (req, res) => {
    const userId = req.params.id;
    const { newRating } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        const totalRating = user.rating * user.rateCount;
        const updatedRateCount = user.rateCount + 1;
        const updatedRating = (totalRating + newRating) / updatedRateCount;

        user.rating = updatedRating;
        user.rateCount = updatedRateCount;

        await user.save();

        res.send({ message: "rating updated" });
    } catch (error) {
        res.status(400).json({ message: "Error at Rating", error });
    }
});

// In UserRoutes.js (or similar)
userRouter.post('/save-push-token', async (req, res) => {
  const { userId, fcmToken } = req.body;
//    console.log("rbexpotoken",req.body)
  if (!userId || !fcmToken) {
    return res.send({ success: false, message: 'Missing userId or token' });
  }

  try {
    // Update user record with token (adjust based on your DB model)
    await User.findByIdAndUpdate(userId, { fcmToken });
    res.send({ success: true, message: 'Push token saved' });
  } catch (err) {
    console.error('Error saving push token:', err);
    res.send({ success: false, message: 'Server error' });
  }
});


module.exports = userRouter;
