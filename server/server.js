// server.js - Main server file for the MERN blog application

//  - Exports the Express app (no DB connect or listen)
const express = require('express');
const setupMiddleware = require('./middleware/setupMiddleware');

// Import routes
const postRoutes = require('./routes/posts');
const categoryRoutes = require('./routes/categories');
const authRoutes = require('./routes/auth.js');

const app = express();

// Apply middleware
setupMiddleware(app);

// API routes
app.use('/api/posts', postRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth', authRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('SWYP Blog API is running');
});

// Health check route
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server Error',
  });
});

module.exports = app;