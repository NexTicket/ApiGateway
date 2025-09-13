import express from 'express';
import ApiController from '../controllers/apiController.js';

const router = express.Router();

// API information endpoint
router.get('/info', ApiController.getApiInfo);

export default router;