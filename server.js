require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            scriptSrcAttr: ["'unsafe-inline'"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    }
}));

// CORS
app.use(cors());

// Body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Cookie parser
app.use(cookieParser());

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days for guest cart
    }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Make user available to all views
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

// Import routes
const routes = require('./routes');
app.use('/', routes);

// 404 handler
app.use((req, res) => {
    res.status(404).render('error', {
        message: 'Page not found',
        user: req.user || null
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    res.status(err.status || 500).render('error', {
        message: err.message || 'Something went wrong',
        user: req.user || null
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════╗
    ║   🛍️  Fashion Store E-commerce Server  ║
    ╠════════════════════════════════════════╣
    ║   Server running on port ${PORT}        ║
    ║   Environment: ${process.env.NODE_ENV || 'development'}                  ║
    ║                                        ║
    ║   🌐 Local: http://localhost:${PORT}     ║
    ║   📧 Email: ${process.env.EMAIL_USER ? '✅ Configured' : '❌ Not configured'}    ║
    ║   💳 Payment: VNPay, MoMo, COD         ║
    ╚════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = app;
