import { proxyConfig } from '../config/proxy.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

class HealthController {
    /**
     * Basic health check endpoint
     */
    static getHealth(req, res) {
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: packageJson.version,
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development'
        });
    }

    /**
     * Services health check endpoint
     */
    static async getServicesHealth(req, res) {
        try {
            const servicesHealth = await proxyConfig.checkServicesHealth();
            const overallHealthy = Object.values(servicesHealth).every(
                service => service.status === 'healthy'
            );

            res.status(overallHealthy ? 200 : 503).json({
                overall: overallHealthy ? 'healthy' : 'degraded',
                services: servicesHealth,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                error: 'Health Check Failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
}

export default HealthController;