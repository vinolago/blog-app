// middleware/fakeAuth.js - Fake authentication for development/testing

const mongoose = require('mongoose');

// Fake user middleware for development
const fakeAuth = async (req, res, next) => {
  try {
    // Check if we're in development mode with fake user enabled
    const useFakeAuth = process.env.NODE_ENV === 'development' && process.env.USE_FAKE_AUTH === 'true';
    
    if (useFakeAuth) {
      // Create a fake user object
      const fakeUserId = process.env.FAKE_USER_ID || '507f1f77bcf86cd799439011';
      
      // Check if fake user exists in database, create if not
      const User = require('../models/User');
      let fakeUser = await User.findById(fakeUserId);
      
      if (!fakeUser) {
        // Create fake user if it doesn't exist
        fakeUser = await User.create({
          _id: new mongoose.Types.ObjectId(fakeUserId),
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123', // Will be hashed by pre-save hook
          role: 'user'
        });
      }
      
      // Attach fake user to request
      req.user = fakeUser;
      return next();
    }
    
    // If not in fake auth mode, continue to real authentication
    next();
  } catch (error) {
    console.error('Fake auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Fake authentication setup failed'
    });
  }
};

module.exports = fakeAuth;
