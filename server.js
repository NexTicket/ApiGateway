import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import firebaseConfig from './config/firebase.js';
import routes from './routes/index.js';

/**
 * Simplified API Gateway
 * Just handles authentication and forwards requests to services
 */
class APIGateway {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 5000;
        this.initializeFirebase();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    /**
     * Initialize Firebase for authentication
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
     * Setup simple middleware stack
     */
    setupMiddleware() {
        // Basic security
        this.app.use(helmet());

        // CORS - allow all origins
        this.app.use(cors({
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        }));

        // Simple request logging
        this.app.use((req, res, next) => {
            console.log(`${req.method} ${req.originalUrl}`);
            next();
        });

        // Body parsing - but skip multipart/form-data (file uploads)
        this.app.use((req, res, next) => {
            const contentType = req.headers['content-type'] || '';
            if (contentType.includes('multipart/form-data')) {
                console.log('🔄 Skipping body parsing for multipart request (file upload)');
                return next();
            }
            
            // Apply JSON parser for non-multipart requests
            express.json({ limit: '50mb' })(req, res, next);
        });
        
        this.app.use((req, res, next) => {
            const contentType = req.headers['content-type'] || '';
            if (contentType.includes('multipart/form-data')) {
                return next();
            }
            
            // Apply URL-encoded parser for non-multipart requests
            express.urlencoded({ extended: true, limit: '50mb' })(req, res, next);
        });
    }

    /**
     * Setup routes
     */
    setupRoutes() {
        this.app.use('/', routes);
    }

    /**
     * Setup simple error handling
     */
    setupErrorHandling() {
        // Global error handler
        this.app.use((error, req, res, next) => {
            console.error(`Error:`, error);
            
            res.status(error.status || 500).json({
                error: 'Server Error',
                message: 'An error occurred processing your request'
            });
        });

        // Process error handlers
        process.on('unhandledRejection', (reason) => {
            console.error('Unhandled Rejection:', reason);
        });

        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
        });
    }

    /**
     * Start the API Gateway server
     */
    start() {
        this.server = this.app.listen(this.port, () => {
            console.log('NexTicket API Gateway started successfully!');
            console.log(`Server running on port ${this.port}`);
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
}

// Create and start the API Gateway
const gateway = new APIGateway();
gateway.start();

export default APIGateway;
