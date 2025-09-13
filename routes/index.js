import express from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import apiRoutes from './apiRoutes.js';
import serviceRoutes from './serviceRoutes.js';
import ApiController from '../controllers/apiController.js';

const router = express.Router();

// Mount all route modules
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/api', apiRoutes);

// Service proxy routes are mounted at root level
router.use('/', serviceRoutes);

// Root endpoint
router.get('/', ApiController.getRoot);

// Catch-all for undefined routes
router.use('*', ApiController.handleNotFound);

export default router;