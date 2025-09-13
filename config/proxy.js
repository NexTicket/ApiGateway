import { createProxyMiddleware } from 'http-proxy-middleware';

/**
 * Proxy configuration for different backend services
 * Maps route prefixes to backend service URLs
 */
class ProxyConfig {
    constructor() {
        // Service configurations
        this.services = {
            notification: {
                target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5001',
                pathRewrite: { '^/notifi_service': '' },
                changeOrigin: true,
                requireAuth: true
            },
            event: {
                target: process.env.EVENT_SERVICE_URL || 'http://localhost:4000',
                pathRewrite: { '^/event_service': '' },
                changeOrigin: true,
                requireAuth: true
            },
            ticket: {
                target: process.env.TICKET_SERVICE_URL || 'http://localhost:8000',
                pathRewrite: { '^/ticket_service': '' },
                changeOrigin: true,
                requireAuth: true
            },
            public: {
                target: process.env.PUBLIC_SERVICE_URL || 'http://localhost:5003',
                pathRewrite: { '^/public': '' },
                changeOrigin: true,
                requireAuth: false
            }
        };
    }

    /**
     * Create proxy middleware for a specific service
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
            changeOrigin: serviceConfig.changeOrigin,
            pathRewrite: serviceConfig.pathRewrite,
            
            // Custom headers to add service info
            onProxyReq: (proxyReq, req, res) => {
                // Add original host header
                proxyReq.setHeader('X-Forwarded-Host', req.get('Host'));
                
                // Add user information if authenticated
                if (req.user) {
                    proxyReq.setHeader('X-User-ID', req.user.uid);
                    proxyReq.setHeader('X-User-Email', req.user.email || '');
                    proxyReq.setHeader('X-User-Roles', JSON.stringify(req.user.roles || []));
                }
                
                // Add service identifier
                proxyReq.setHeader('X-Gateway-Service', serviceName);
                proxyReq.setHeader('X-Gateway-Timestamp', Date.now().toString());

                console.log(`Proxying ${req.method} ${req.url} to ${serviceConfig.target}`);
            },

            // Handle proxy errors
            onError: (err, req, res) => {
                console.error(`Proxy error for ${serviceName}:`, err.message);
                
                if (!res.headersSent) {
                    res.status(502).json({
                        error: 'Bad Gateway',
                        message: `Service ${serviceName} is currently unavailable`,
                        service: serviceName,
                        timestamp: new Date().toISOString()
                    });
                }
            },

            // Handle proxy response
            onProxyRes: (proxyRes, req, res) => {
                // Add CORS headers if needed
                proxyRes.headers['Access-Control-Allow-Origin'] = '*';
                proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
                proxyRes.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';
                
                // Add service identification header
                proxyRes.headers['X-Proxied-By'] = 'NexTicket-API-Gateway';
                proxyRes.headers['X-Service'] = serviceName;

                console.log(`Response from ${serviceName}: ${proxyRes.statusCode}`);
            },

            // Timeout configuration
            timeout: parseInt(process.env.PROXY_TIMEOUT) || 30000, // 30 seconds default
            proxyTimeout: parseInt(process.env.PROXY_TIMEOUT) || 30000,

            // Security: Don't forward certain headers
            ignorePath: false,
            secure: process.env.NODE_ENV === 'production',
            
            // Health check bypass
            bypass: (req, res) => {
                // Allow health checks to bypass proxy
                if (req.path === '/health' || req.path === '/ping') {
                    return '/health';
                }
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
     * Health check for all services
     * @returns {Promise<Object>} Health status of all services
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
                    url: config.target,
                    responseTime: response.headers.get('response-time') || 'unknown'
                };
            } catch (error) {
                healthStatus[serviceName] = {
                    status: 'unreachable',
                    url: config.target,
                    error: error.message
                };
            }
        }
        
        return healthStatus;
    }
}

// Export singleton instance
const proxyConfig = new ProxyConfig();

export { ProxyConfig, proxyConfig };