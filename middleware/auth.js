import firebaseConfig from '../config/firebase.js';

/**
 * Middleware to verify Firebase JWT tokens
 * Extracts token from Authorization header, verifies it, and attaches user info to req.user
 */
class AuthMiddleware {
    /**
     * Extract token from Authorization header
     * @param {Object} req - Express request object
     * @returns {string|null} - Extracted token or null
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
     * Middleware function to verify Firebase JWT token
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next function
     */
    static async verifyToken(req, res, next) {
        try {
            // Extract token from Authorization header
            const token = AuthMiddleware.extractToken(req);
            
            if (!token) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'No token provided. Please include Authorization: Bearer <token> header.'
                });
            }

            // Verify token with Firebase
            const decodedToken = await firebaseConfig.verifyIdToken(token);

            // Attach user info to request object using token data only
            req.user = {
                uid: decodedToken.uid,
                email: decodedToken.email,
                emailVerified: decodedToken.email_verified,
                name: decodedToken.name,
                picture: decodedToken.picture,
                roles: decodedToken.roles || [], // Custom claims for roles
                customClaims: decodedToken, // Full custom claims
                firebase: {
                    identities: decodedToken.firebase?.identities || {},
                    sign_in_provider: decodedToken.firebase?.sign_in_provider || 'unknown'
                },
                auth_time: decodedToken.auth_time,
                exp: decodedToken.exp,
                iat: decodedToken.iat
            };

            // Log successful authentication (optional, remove in production)
            console.log(`Authenticated user: ${req.user.email} (${req.user.uid})`);

            next();

        } catch (error) {
            console.error('Token verification failed:', error.message);
            
            // Determine error type for appropriate response
            if (error.message.includes('expired')) {
                return res.status(401).json({
                    error: 'Token Expired',
                    message: 'The provided token has expired. Please authenticate again.'
                });
            }
            
            if (error.message.includes('invalid')) {
                return res.status(401).json({
                    error: 'Invalid Token',
                    message: 'The provided token is invalid or malformed.'
                });
            }

            return res.status(401).json({
                error: 'Authentication Failed',
                message: 'Token verification failed. Please check your token and try again.'
            });
        }
    }

    /**
     * Optional middleware to check for specific roles
     * @param {string|string[]} requiredRoles - Required role(s)
     * @returns {Function} Express middleware function
     */
    static requireRoles(requiredRoles) {
        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Authentication required'
                });
            }

            const userRoles = req.user.roles || [];
            const hasRequiredRole = roles.some(role => userRoles.includes(role));

            if (!hasRequiredRole) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: `Access denied. Required roles: ${roles.join(', ')}`
                });
            }

            next();
        };
    }

    /**
     * Optional middleware for admin-only access
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next function
     */
    static requireAdmin(req, res, next) {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
        }

        const userRoles = req.user.roles || [];
        if (!userRoles.includes('admin')) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Admin access required'
            });
        }

        next();
    }

    /**
     * Middleware for optional authentication (doesn't fail if no token)
     * Useful for routes that can work with or without authentication
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next function
     */
    static async optionalAuth(req, res, next) {
        try {
            const token = AuthMiddleware.extractToken(req);
            
            if (token) {
                const decodedToken = await firebaseConfig.verifyIdToken(token);

                req.user = {
                    uid: decodedToken.uid,
                    email: decodedToken.email,
                    emailVerified: decodedToken.email_verified,
                    name: decodedToken.name,
                    roles: decodedToken.roles || [],
                    customClaims: decodedToken
                };
            }

            next();
        } catch (error) {
            // For optional auth, we continue even if token verification fails
            console.log('Optional auth failed, continuing without user:', error.message);
            next();
        }
    }
}

export default AuthMiddleware;