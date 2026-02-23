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
        process.env.CLIENT_URL, // Production client URL (e.g., Cloudflare Pages)
    ].filter(Boolean);

    app.use(cors({
        origin: allowedOrigins,
        credentials: true,
    })
    );

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
