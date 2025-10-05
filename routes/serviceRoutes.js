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

// Public routes (no authentication required)
router.use('/public', requestLogger, proxyConfig.createServiceProxy('public'));

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

export default router;