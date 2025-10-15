import { createProxyMiddleware } from 'http-proxy-middleware';

/**
 * Simple proxy configuration for different backend services
 * Maps route prefixes to backend service URLs
 */
class ProxyConfig {
    constructor() {
        // Service configurations
        this.services = {
            notification: {
                target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5001',
                pathRewrite: { '^/notifi_service': '' },
                requireAuth: true
            },
            event: {
                target: process.env.EVENT_SERVICE_URL || 'http://localhost:4000',
                pathRewrite: { '^/event_service': '' },
                requireAuth: true
            },
            ticket: {
                target: process.env.TICKET_SERVICE_URL || 'http://localhost:8000',
                pathRewrite: { '^/ticket_service': '' },
                requireAuth: true
            },
            user: {
                target: process.env.USER_SERVICE_URL || 'http://localhost:4001',
                pathRewrite: { '^/user_service': '' },
                requireAuth: true
            },
            public: {
                target: process.env.PUBLIC_SERVICE_URL || 'http://localhost:5003',
                pathRewrite: { '^/public': '' },
                requireAuth: false
            }
        };
    }

    /**
     * Create simple proxy middleware for a specific service
     * @param {string} serviceName - Name of the service
     * @returns {Function} Proxy middleware
     */
    createServiceProxy(serviceName) {
        const serviceConfig = this.services[serviceName];
        
        if (!serviceConfig) {
            throw new Error(`Unknown service: ${serviceName}`);
        }

        const proxyOptions = {
            target: serviceConfig.target,
            changeOrigin: true,
            pathRewrite: serviceConfig.pathRewrite,
            
            // Simple request handler that forwards all headers and body
            onProxyReq: (proxyReq, req, res) => {
                // Simply pass all headers from the original request
                Object.keys(req.headers).forEach(header => {
                    proxyReq.setHeader(header, req.headers[header]);
                });
                
                // Add user information as headers if user is authenticated
                if (req.user) {
                    proxyReq.setHeader('X-User-ID', req.user.uid);
                    proxyReq.setHeader('X-User-Email', req.user.email || '');
                    // Forward role information - check both singular and array formats
                    let userRole = req.user.role;
                    if (!userRole && Array.isArray(req.user.roles) && req.user.roles.length > 0) {
                        userRole = req.user.roles[0];
                    }
                    if (userRole) {
                        proxyReq.setHeader('X-User-Role', userRole);
                    }
                }
                
                // Simple logging
                console.log(`Forwarding ${req.method} ${req.originalUrl} to ${serviceConfig.target}`);
                if (req.user) {
                    console.log(`User authenticated: ${req.user.email} (role: ${req.user.role || req.user.roles})`);
                }
                
                // For POST/PUT requests, make sure to forward the body correctly
                if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
                    const bodyData = JSON.stringify(req.body);
                    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                    // Write the body to the proxied request
                    proxyReq.write(bodyData);
                }
            },

            // Simple error handling
            onError: (err, req, res) => {
                console.error(`Service ${serviceName} error:`, err.message);
                
                if (!res.headersSent) {
                    res.status(502).json({
                        error: 'Service Unavailable',
                        message: `Service ${serviceName} is currently unavailable`,
                        service: serviceName
                    });
                }
            },

            // Add CORS headers to response
            onProxyRes: (proxyRes, req, res) => {
                proxyRes.headers['Access-Control-Allow-Origin'] = '*';
                proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
                proxyRes.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';
                
                console.log(`Response from ${serviceName}: ${proxyRes.statusCode}`);
            }
        };

        return createProxyMiddleware(proxyOptions);
    }

    /**
     * Get all configured services
     * @returns {Object} Service configurations
     */
    getServices() {
        return this.services;
    }

    /**
     * Check if a service requires authentication
     * @param {string} serviceName - Name of the service
     * @returns {boolean} Whether authentication is required
     */
    requiresAuth(serviceName) {
        const serviceConfig = this.services[serviceName];
        return serviceConfig ? serviceConfig.requireAuth : true;
    }

    /**
     * Get service configuration
     * @param {string} serviceName - Name of the service
     * @returns {Object|null} Service configuration or null
     */
    getServiceConfig(serviceName) {
        return this.services[serviceName] || null;
    }

    /**
     * Simple health check for services
     */
    async checkServicesHealth() {
        const healthStatus = {};
        
        for (const [serviceName, config] of Object.entries(this.services)) {
            try {
                const fetch = (await import('node-fetch')).default;
                const response = await fetch(`${config.target}/health`, {
                    method: 'GET',
                    timeout: 5000
                });
                
                healthStatus[serviceName] = {
                    status: response.ok ? 'healthy' : 'unhealthy',
                    url: config.target
                };
            } catch (error) {
                healthStatus[serviceName] = {
                    status: 'unreachable',
                    url: config.target
                };
            }
        }
        
        return healthStatus;
    }
}

// Export singleton instance
const proxyConfig = new ProxyConfig();

export { ProxyConfig, proxyConfig };