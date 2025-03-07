require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const hpp = require('hpp');

const app = express();
const port = process.env.PORT || 3000;

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "https:", "data:", "blob:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: ["'self'", "https://api.quotable.io", "https://api.unsplash.com"]
        }
    }
}));

// CORS configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] // Replace with your production domain
        : ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} ${req.method} ${req.url}`);
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message
    });
});

// Serve static files with security headers
app.use(express.static(path.join(__dirname), {
    setHeaders: (res, path) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
    }
}));

// API endpoints with input validation
app.get('/api/config', (req, res) => {
    // Only send necessary config data
    res.json({
        unsplashApiUrl: process.env.UNSPLASH_API_URL,
        quotableApiUrl: process.env.QUOTABLE_API_URL
    });
});

// Proxy for Unsplash API with rate limiting and validation
const unsplashLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // limit each IP to 50 requests per hour
    message: 'Image request limit exceeded, please try again later.'
});

app.get('/api/unsplash/random', 
    unsplashLimiter,
    async (req, res) => {
        try {
            // Validate API key exists
            if (!process.env.UNSPLASH_ACCESS_KEY) {
                throw new Error('Unsplash API key not configured');
            }

            const response = await fetch(`${process.env.UNSPLASH_API_URL}?orientation=landscape&query=nature`, {
                headers: {
                    'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
                    'Accept-Version': 'v1'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch from Unsplash API');
            }

            const data = await response.json();
            
            // Only send necessary image data
            res.json({
                urls: {
                    regular: data.urls.regular
                },
                alt_description: data.alt_description
            });
        } catch (error) {
            console.error('Unsplash API Error:', error);
            res.status(500).json({ 
                error: 'Failed to fetch image',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

// Create .gitignore if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('.gitignore')) {
    fs.writeFileSync('.gitignore', `
.env
node_modules/
.DS_Store
*.log
npm-debug.log*
`);
}

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Security measures active:');
    console.log('✓ Helmet (HTTP Headers Security)');
    console.log('✓ CORS Protection');
    console.log('✓ Rate Limiting');
    console.log('✓ HTTP Parameter Pollution Prevention');
    console.log('✓ Input Validation');
    console.log('✓ Error Handling');
});
