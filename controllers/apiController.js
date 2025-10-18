import { proxyConfig } from '../config/proxy.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

class ApiController {
    /**
     * API information endpoint
     */
    static getApiInfo(req, res) {
        const services = proxyConfig.getServices();
        res.json({
            name: 'NexTicket API Gateway',
            version: packageJson.version,
            routes: {
                '/notifi_service/*': {
                    target: services.notification.target,
                    authentication: 'required'
                },
                '/event_service/*': {
                    target: services.event.target,
                    authentication: 'required'
                },
                '/event_service/public/*': {
                    target: services.event.target,
                    authentication: 'none',
                    description: 'Public event endpoints (no auth required)',
                    pathRewrite: '^/event_service/public'
                },
                '/ticket_service/*': {
                    target: services.ticket.target,
                    authentication: 'required'
                },
                '/ticket_service/public/*': {
                    target: services.ticket.target,
                    authentication: 'none',
                    description: 'Public ticket endpoints (no auth required)',
                    pathRewrite: '^/ticket_service/public'
                },
                '/user_service/*': {
                    target: services.user.target,
                    authentication: 'required'
                },
                '/public/*': {
                    target: services.public.target,
                    authentication: 'none'
                }
            },
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Root endpoint
     */
    static getRoot(req, res) {
        res.json({
            message: 'NexTicket API Gateway',
            version: packageJson.version,
            documentation: '/api/info',
            health: '/health',
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Handle 404 for undefined routes
     */
    static handleNotFound(req, res) {
        res.status(404).json({
            error: 'Not Found',
            message: `Route ${req.originalUrl} not found`,
            availableRoutes: [
                '/health',
                '/health/services',
                '/api/info',
                '/auth/test',
                '/public/*',
                '/event_service/public/* (no auth)',
                '/ticket_service/api/webhooks/* (no auth)',
                '/notifi_service/*',
                '/event_service/*',
                '/ticket_service/*',
                '/user_service/*'
            ],
            timestamp: new Date().toISOString()
        });
    }
}

export default ApiController;