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
            console.log('Decoded Token:', decodedToken);

            // Set minimal user info - just what's needed
            // Firebase custom claims use 'role' (singular), not 'roles' (plural)
            req.user = {
                uid: decodedToken.uid,
                email: decodedToken.email,
                role: decodedToken.role || decodedToken.roles?.[0] || 'customer' // Check both formats
            };

            console.log(`Auth successful: ${req.user.email} (${req.user.role})`);
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

            // Check if user has the required role (singular)
            const hasRole = roles.includes(req.user.role);
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

        if (req.user.role !== 'admin') {
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
                // Firebase custom claims use 'role' (singular)
                req.user = {
                    uid: decodedToken.uid,
                    email: decodedToken.email,
                    role: decodedToken.role || decodedToken.roles?.[0] || 'customer'
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