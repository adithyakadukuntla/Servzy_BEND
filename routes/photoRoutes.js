const exp = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Photographer = require('../models/Photographer');
require('dotenv').config()
const photoRouter = exp.Router();

// Register new photographer
photoRouter.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    
    const existingPhotographer = await Photographer.findOne({ 
      email: email.toLowerCase() 
    });
    
    if (existingPhotographer) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    
    const newPhotographer = new Photographer({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: '', 
      phone: '', 
      specialization: 'Other',
      location: '', 
      city: '', 
      state: '', 
      priceRange: {
        min: 0,
        max: 0,
        currency: 'INR'
      },
      profileComplete: false
    });

    const savedPhotographer = await newPhotographer.save();

   
    const token = jwt.sign(
      { 
        photographerId: savedPhotographer._id,
        email: savedPhotographer.email 
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      photographer: {
        _id: savedPhotographer._id,
        email: savedPhotographer.email,
        profileComplete: false
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Login photographer
photoRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const photographer = await Photographer.findOne({ 
      email: email.toLowerCase() 
    });

    if (!photographer) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    
    if (!photographer.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

   
    const isValidPassword = await bcrypt.compare(password, photographer.password);
    
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    
    if (!process.env.JWT_SECRET_KEY) {
      console.error('JWT_SECRET environment variable is not set');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    
    const profileComplete = !!(
      photographer.name && 
      photographer.phone && 
      photographer.specialization &&
      photographer.location &&
      photographer.city &&
      photographer.state &&
      photographer.priceRange?.min > 0 &&
      photographer.priceRange?.max > 0 &&
      photographer.services?.length > 0
    );

   
    const token = jwt.sign(
      { 
        photographerId: photographer._id,
        email: photographer.email 
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      photographer: {
        _id: photographer._id,
        email: photographer.email,
        name: photographer.name,
        profileComplete,
        verified: photographer.verified,
        rating: photographer.rating,
        totalReviews: photographer.totalReviews
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});


// Update photographer profile
photoRouter.put('/profile/:id', async (req, res) => {
 
  try {
    const { id } = req.params;
    const profileData = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid photographer ID'
      });
    }

    delete profileData.password;
    delete profileData.email;
    delete profileData._id;

    // Update photographer profile
    const updatedPhotographer = await Photographer.findByIdAndUpdate(
      id,
      { 
        ...profileData,
        profileComplete: true 
      },
      { 
        new: true, 
        runValidators: true 
      }
    );

    if (!updatedPhotographer) {
      return res.status(404).json({
        success: false,
        message: 'Photographer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      photographer: updatedPhotographer
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    });
  }
});

// Get photographer profile
photoRouter.get('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // console.log("pid called",id)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid photographer ID'
      });
    }

    const photographer = await Photographer.findById(id).select('-password');

    if (!photographer) {
      return res.status(404).json({
        success: false,
        message: 'Photographer not found'
      });
    }

    res.status(200).json({
      success: true,
      payload:photographer
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Existing review route (unchanged)
photoRouter.post('/review', async (req, res) => {
  try {
    const { photographerId, rating, comment, userName } = req.body;
    
    // Validate input
    if (!photographerId || !rating || !comment) {
      return res.status(400).json({
        message: "Missing required fields",
        required: ["photographerId", "rating", "comment"]
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5"
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(photographerId)) {
      return res.status(400).json({
        message: "Invalid photographer ID format"
      });
    }

    // Find the photographer
    const photographer = await Photographer.findById(photographerId);
    if (!photographer) {
      return res.status(404).json({
        message: "Photographer not found"
      });
    }

    // Create new review object
    const newReview = {
      userName: userName || "Anonymous User",
      rating: parseInt(rating),
      comment: comment.trim(),
      date: new Date()
    };

    // Add review
    photographer.reviews.push(newReview);
    const savedPhotographer = await photographer.save();
    
    // Get the newly added review
    const addedReview = savedPhotographer.reviews[savedPhotographer.reviews.length - 1];

    res.status(200).json({
      message: "Review added successfully",
      review: addedReview,
      newRating: savedPhotographer.rating,
      totalReviews: savedPhotographer.totalReviews
    });

  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

// Existing get all photographers route (unchanged)
photoRouter.get('/allpshooters/:pincode', async (req, res) => {

  try {
    const {pincode} = req.params;
    const data = await Photographer.find({ isActive: true, pincode}).select('-password');
    
    if (data && data.length > 0) {
      res.status(200).json({
        message: "all-photo data",
        payload: data,
        count: data.length
      });
    } else {
      res.status(200).json({
        message: "Please change your address and try again",
        payload: []
      });
    }
  } catch (error) {
    console.error('Error fetching photographers:', error);
    res.status(500).json({
      message: "server error",
      error: error.message
    });
  }
});

// searrch the photographers with the search bar
photoRouter.get('/search',async(req,res)=>{
  try{
     const searchQuery = req.query.searchQuery;
    // console.log("cls",searchQuery)
    
    const searchRegex = new RegExp(searchQuery, 'i');

    const photographers = await Photographer.find({
      isActive: true,
      $or: [
        { name: searchRegex },
        { businessName: searchRegex },
        { city: searchRegex },
        { state: searchRegex }
      ]
    });

    return res.status(200).json({
      message: 'search-photo data',
      payload: photographers
    });

  }catch(err){
    res.send({message:"error occurred"})
  }
})
// Update photographer portfolio
photoRouter.put('/portfolio/:id', async (req, res) => {
  
  try {
    const { id } = req.params;
    const { portfolio } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid photographer ID'
      });
    }

    // Validate portfolio array
    if (!Array.isArray(portfolio)) {
      return res.status(400).json({
        success: false,
        message: 'Portfolio must be an array of image URLs'
      });
    }

    // Filter out empty strings and validate URLs
    const validPortfolio = portfolio.filter(url => {
      if (typeof url !== 'string' || url.trim() === '') return false;
      
      // Basic URL validation
      try {
        new URL(url);
        return true;
      } catch (error) {
        return false;
      }
    });

    // Update photographer portfolio
    const updatedPhotographer = await Photographer.findByIdAndUpdate(
      id,
      { portfolio: validPortfolio },
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-password');

    if (!updatedPhotographer) {
      return res.status(404).json({
        success: false,
        message: 'Photographer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Portfolio updated successfully',
      portfolio: updatedPhotographer.portfolio,
      photographer: updatedPhotographer
    });

  } catch (error) {
    console.error('Portfolio update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during portfolio update'
    });
  }
});

// Add single image to portfolio
photoRouter.post('/portfolio/:id/add', async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid photographer ID'
      });
    }

    // Validate image URL
    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Valid image URL is required'
      });
    }

    // Basic URL validation
    try {
      new URL(imageUrl);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format'
      });
    }

    // Find photographer and add image to portfolio
    const photographer = await Photographer.findById(id);
    
    if (!photographer) {
      return res.status(404).json({
        success: false,
        message: 'Photographer not found'
      });
    }

    // Check if image already exists in portfolio
    if (photographer.portfolio.includes(imageUrl.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Image already exists in portfolio'
      });
    }

    // Add image to portfolio using $push operator
    const updatedPhotographer = await Photographer.findByIdAndUpdate(
      id,
      { $push: { portfolio: imageUrl.trim() } },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Image added to portfolio successfully',
      portfolio: updatedPhotographer.portfolio,
      addedImage: imageUrl.trim()
    });

  } catch (error) {
    console.error('Add portfolio image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding image to portfolio'
    });
  }
});


photoRouter.post('/save-push-token', async (req, res) => {
  const { pId, fcmToken } = req.body;
  //  console.log("rbexpotoken",req.body)
  if (!pId || !fcmToken) {
    return res.send({ success: false, message: 'Missing userId or token' });
  }

  try {
    // Update user record with token (adjust based on your DB model)
    await Photographer.findByIdAndUpdate(pId, { fcmToken });
    res.send({ success: true, message: 'Push token saved' });
  } catch (err) {
    console.error('Error saving push token:', err);
    res.send({ success: false, message: 'Server error' });
  }
});


module.exports = photoRouter;
