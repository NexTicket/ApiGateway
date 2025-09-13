class AuthController {
    /**
     * Authentication test endpoint
     */
    static testAuth(req, res) {
        res.json({
            message: 'Authentication successful',
            user: {
                uid: req.user.uid,
                email: req.user.email,
                roles: req.user.roles,
                emailVerified: req.user.emailVerified
            },
            timestamp: new Date().toISOString()
        });
    }
}

export default AuthController;