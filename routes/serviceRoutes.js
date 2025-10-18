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

// Public event service routes (no authentication required)
// Add specific public endpoints for event service
router.use('/event_service/public',
    requestLogger,
    proxyConfig.createServiceProxy('event_public') 
);

// Public ticket service routes (no authentication required)
// Stripe webhooks and other public endpoints
router.use('/ticket_service/public',
    requestLogger,
    proxyConfig.createServiceProxy('ticket_public')  
);

// Protected routes (authentication required)
router.use('/notifi_service', 
    AuthMiddleware.verifyToken,
    requestLogger,
    proxyConfig.createServiceProxy('notification')
);

router.use('/event_service', 
    AuthMiddleware.verifyToken,
    requestLogger,
    proxyConfig.createServiceProxy('event')
);

router.use('/ticket_service',
    AuthMiddleware.verifyToken,
    requestLogger,
    proxyConfig.createServiceProxy('ticket')
);

router.use('/user_service',
    AuthMiddleware.verifyToken,
    requestLogger,
    proxyConfig.createServiceProxy('user')
);

export default router;