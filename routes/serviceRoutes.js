import express from 'express';
import { proxyConfig } from '../config/proxy.js';
import AuthMiddleware from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.use('/public', proxyConfig.createServiceProxy('public'));

// Protected routes (authentication required)
router.use('/notifi_service', 
    AuthMiddleware.verifyToken, 
    proxyConfig.createServiceProxy('notification')
);

router.use('/event_service', 
    AuthMiddleware.verifyToken, 
    proxyConfig.createServiceProxy('event')
);

router.use('/ticket_service', 
    AuthMiddleware.verifyToken, 
    proxyConfig.createServiceProxy('ticket')
);

export default router;