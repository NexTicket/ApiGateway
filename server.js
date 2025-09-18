import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import morgan from 'morgan';

// Import configurations and middleware
import firebaseConfig from './config/firebase.js';
import routes from './routes/index.js';

class APIGateway {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.initializeFirebase();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    /**
     * Initialize Firebase Admin SDK
     */
    initializeFirebase() {
        try {
            firebaseConfig.initialize({
                projectId: process.env.FIREBASE_PROJECT_ID,
                serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH
            });
            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Firebase initialization failed:', error.message);
            console.log('API Gateway will start but authentication will not work');
        }
    }

    /**
     * Setup middleware stack
     */
    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
            crossOriginEmbedderPolicy: false
        }));

        // CORS configuration
        this.app.use(cors({
            origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
            credentials: true
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
            max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
            message: {
                error: 'Too Many Requests',
                message: 'Too many requests from this IP, please try again later.',
                retryAfter: '15 minutes'
            },
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use(limiter);

        // Logging
        this.app.use(morgan('combined', {
            skip: (req, res) => res.statusCode < 400 // Only log errors in production
        }));

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request ID middleware for tracking
        this.app.use((req, res, next) => {
            req.requestId = Math.random().toString(36).slice(2, 11);
            res.setHeader('X-Request-ID', req.requestId);
            next();
        });
    }

    /**
     * Setup API routes and proxies
     */
    setupRoutes() {
        // Mount all routes from the routes module
        this.app.use('/', routes);
    }

    /**
     * Setup error handling middleware
     */
    setupErrorHandling() {
        // Global error handler
        this.app.use((error, req, res, next) => {
            console.error(`Error ${req.requestId}:`, error);

            // Don't leak error details in production
            const isDevelopment = process.env.NODE_ENV !== 'production';
            
            res.status(error.status || 500).json({
                error: error.name || 'Internal Server Error',
                message: error.message || 'An unexpected error occurred',
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
                ...(isDevelopment && { stack: error.stack })
            });
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            process.exit(1);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM received, shutting down gracefully');
            this.server.close(() => {
                console.log('Process terminated');
            });
        });
    }

    /**
     * Start the API Gateway server
     */
    start() {
        this.server = this.app.listen(this.port, () => {
            console.log('NexTicket API Gateway started successfully!');
            console.log(`Server running on port ${this.port}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`Health check: http://localhost:${this.port}/health`);
            console.log(`API info: http://localhost:${this.port}/api/info`);
        });

        return this.server;
    }

    /**
     * Stop the API Gateway server
     */
    stop() {
        if (this.server) {
            this.server.close();
        }
    }

    /**
     * Get Express app instance
     */
    getApp() {
        return this.app;
    }
}

// Create and start the API Gateway if this file is run directly
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1].endsWith('server.js')) {
    const gateway = new APIGateway();
    gateway.start();
}

export default APIGateway;