import express from 'express';
import { proxyConfig } from '../config/proxy.js';
import AuthMiddleware from '../middleware/auth.js';

const router = express.Router();

// Simple request logger middleware
const requestLogger = (req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    if (req.method === 'POST' || req.method === 'PUT') {
        console.log('Body:', JSON.stringify(req.body));
    }
    next();
};

// Public routes (optional authentication - sends user info if token is present)
// This allows public access while also enabling authenticated users to get role-based content
router.use('/public', 
    AuthMiddleware.optionalAuth,
    requestLogger, 
    proxyConfig.createServiceProxy('public')
);

// Middleware to conditionally apply auth based on HTTP method and route
const conditionalAuth = (req, res, next) => {
    const path = req.path;
    const method = req.method;
    
    // Public GET endpoints for EVENT SERVICE (no auth required)
    const publicGetPatterns = [
        /^\/api\/events$/,                          // GET /api/events
        /^\/api\/events\/geteventbyid\/[^/]+$/,    // GET /api/events/geteventbyid/:id
        /^\/api\/events\/venue\/[^/]+$/,           // GET /api/events/venue/:venueId
        /^\/api\/events\/organizer\/[^/]+$/,       // GET /api/events/organizer/:organizerId
        /^\/api\/venues$/,                          // GET /api/venues
        /^\/api\/venues\/getvenuebyid\/[^/]+$/,    // GET /api/venues/getvenuebyid/:id
        /^\/api\/venues\/type\/[^/]+$/,            // GET /api/venues/type/:type
        /^\/api\/venues\/\d+\/seats$/              // GET /api/venues/:id/seats - Seat map viewing
    ];
    
    // Check if it's a public GET request
    if (method === 'GET' && publicGetPatterns.some(pattern => pattern.test(path))) {
        console.log(`📖 Public GET request allowed: ${method} ${path}`);
        return next();
    }
    
    // All other requests require authentication
    console.log(`🔒 Protected request, auth required: ${method} ${path}`);
    return AuthMiddleware.verifyToken(req, res, next);
};

// Middleware to conditionally apply auth for TICKET SERVICE
const conditionalAuthTicket = (req, res, next) => {
    const path = req.path;
    const method = req.method;
    
    // Public GET endpoints for TICKET SERVICE (no auth required)
    const publicGetPatternsTicket = [
        /^\/api\/venues-events\/venues$/,           // GET /api/venues-events/venues
        /^\/api\/venues-events\/venues\/[^/]+$/,   // GET /api/venues-events/venues/:id
        /^\/api\/venues-events\/events$/,           // GET /api/venues-events/events
        /^\/api\/venues-events\/events\/[^/]+$/,   // GET /api/venues-events/events/:id
    ];
    
    // Check if it's a public GET request
    if (method === 'GET' && publicGetPatternsTicket.some(pattern => pattern.test(path))) {
        console.log(`📖 Public GET request allowed (Ticket Service): ${method} ${path}`);
        return next();
    }
    
    // All other requests require authentication (orders, locking, etc.)
    console.log(`🔒 Protected request, auth required (Ticket Service): ${method} ${path}`);
    return AuthMiddleware.verifyToken(req, res, next);
};

// Protected routes (authentication required)
router.use('/notifi_service', 
    AuthMiddleware.verifyToken,
    requestLogger,
    proxyConfig.createServiceProxy('notification')
);

// Event service with conditional auth
router.use('/event_service', 
    conditionalAuth,
    requestLogger,
    proxyConfig.createServiceProxy('event')
);

// Ticket service with conditional auth
router.use('/ticket_service',
    conditionalAuthTicket,
    requestLogger,
    proxyConfig.createServiceProxy('ticket')
);

router.use('/user_service',
    AuthMiddleware.verifyToken,
    requestLogger,
    proxyConfig.createServiceProxy('user')
);

export default router;