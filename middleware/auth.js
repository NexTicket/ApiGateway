import firebaseConfig from '../config/firebase.js';

/**
 * Simplified middleware to verify Firebase JWT tokens
 */
class AuthMiddleware {
    /**
     * Extract token from Authorization header
     */
    static extractToken(req) {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return null;
        }

        // Check for Bearer token format
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return null;
        }

        return parts[1];
    }

    /**
     * Middleware function to verify Firebase JWT token - simplified
     */
    static async verifyToken(req, res, next) {
        try {
            // Extract token from Authorization header
            const token = AuthMiddleware.extractToken(req);
            
            if (!token) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'No token provided'
                });
            }

            // Verify token with Firebase
            const decodedToken = await firebaseConfig.verifyIdToken(token);

            // Set minimal user info - just what's needed
            req.user = {
                uid: decodedToken.uid,
                email: decodedToken.email,
                roles: decodedToken.roles || [] // Keep roles for access control
            };

            console.log(`Auth successful: ${req.user.email}`);
            next();

        } catch (error) {
            console.error('Auth failed:', error.message);
            return res.status(401).json({
                error: 'Authentication Failed',
                message: error.message
            });
        }
    }

    /**
     * Simple role check middleware
     */
    static requireRoles(requiredRoles) {
        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const hasRole = roles.some(role => (req.user.roles || []).includes(role));
            if (!hasRole) {
                return res.status(403).json({ error: 'Access denied' });
            }

            next();
        };
    }

    /**
     * Simple admin check
     */
    static requireAdmin(req, res, next) {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!(req.user.roles || []).includes('admin')) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        next();
    }

    /**
     * Optional auth - doesn't require authentication
     */
    static async optionalAuth(req, res, next) {
        try {
            const token = AuthMiddleware.extractToken(req);
            if (token) {
                const decodedToken = await firebaseConfig.verifyIdToken(token);
                // Extract both role and roles
                let userRole = decodedToken.role;
                if (!userRole && Array.isArray(decodedToken.roles) && decodedToken.roles.length > 0) {
                    userRole = decodedToken.roles[0];
                }
                req.user = {
                    uid: decodedToken.uid,
                    email: decodedToken.email,
                    role: userRole || '',
                    roles: decodedToken.roles || []
                };
            }
            next();
        } catch (error) {
            // Continue without user info if auth fails
            next();
        }
    }
}

export default AuthMiddleware;