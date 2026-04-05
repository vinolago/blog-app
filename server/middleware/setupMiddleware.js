//middleware/setupMiddleware.js

const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./logger');
const errorHandler = require('./errorHandler');

const setupMiddleware = (app) => {
    // CORS configuration - allow multiple origins for development and production
    const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:5175",
        "https://blog-bts.pages.dev",
        "https://swypstudio.co.ke",
        "https://www.swypstudio.co.ke",
        "https://api.swypstudio.co.ke",
        "https://blog.swypstudio.co.ke",
        "https://www.blog.swypstudio.co.ke",
        "https://*.pages.dev", // Allow all Cloudflare Pages domains
        process.env.CLIENT_URL, // Production client URL
    ].filter(Boolean);

    app.use(cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            // Also allow if origin is in allowedOrigins
            if (!origin || allowedOrigins.some(allowed => 
                allowed === origin || 
                (allowed.includes('*') && origin.match(allowed.replace('*', '.*')))
            )) {
                callback(null, true);
            } else {
                console.log('CORS blocked origin:', origin);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    }));

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // static files middleware
    app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

    // request logger (dev only)
    if (process.env.NODE_ENV === 'development') {
        app.use(logger);
    }

    // error handler (always last)
    app.use(errorHandler);
};

module.exports = setupMiddleware;
