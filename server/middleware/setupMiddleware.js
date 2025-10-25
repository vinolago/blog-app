//middleware/setupMiddleware.js

const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./logger');
const errorHandler = require('./errorHandler');

const setupMiddleware = (app) => {
    // core middleware
    app.use(cors({
        origin: "http://localhost:5173",
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
