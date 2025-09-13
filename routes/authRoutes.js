import express from 'express';
import AuthController from '../controllers/authController.js';
import AuthMiddleware from '../middleware/auth.js';

const router = express.Router();

// Authentication test endpoint
router.get('/test', AuthMiddleware.verifyToken, AuthController.testAuth);

export default router;