import express from 'express';
import HealthController from '../controllers/healthController.js';

const router = express.Router();

// Basic health check
router.get('/', HealthController.getHealth);

// Services health check
router.get('/services', HealthController.getServicesHealth);

export default router;